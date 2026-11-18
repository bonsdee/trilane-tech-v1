package com.trilanetech.api.lead;

import com.trilanetech.api.catalog.ServiceOffering;
import com.trilanetech.api.catalog.ServiceOfferingRepository;
import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.common.Texts;
import com.trilanetech.api.lead.LeadDtos.LeadDto;
import com.trilanetech.api.lead.LeadDtos.LeadFilter;
import com.trilanetech.api.lead.LeadDtos.LeadSubmission;
import com.trilanetech.api.lead.LeadDtos.NoteDto;
import com.trilanetech.api.user.User;
import com.trilanetech.api.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadService {

    /** Columns the list can be sorted by, mapped to entity properties. */
    private static final Map<String, String> SORTABLE = Map.of(
            "createdAt", "createdAt", "fullName", "fullName", "status", "status", "followUpOn", "followUpOn");
    static final int MAX_PAGE_SIZE = 100;
    static final int MAX_EXPORT_ROWS = 10_000;

    private final LeadRepository leads;
    private final LeadNoteRepository notes;
    private final ServiceOfferingRepository services;
    private final UserRepository users;
    private final ApplicationEventPublisher events;
    private final ZoneId zone;

    public LeadService(LeadRepository leads, LeadNoteRepository notes, ServiceOfferingRepository services,
                       UserRepository users, ApplicationEventPublisher events, AppProperties props) {
        this.leads = leads;
        this.notes = notes;
        this.services = services;
        this.users = users;
        this.events = events;
        this.zone = ZoneId.of(props.timezone());
    }

    public LocalDate today() {
        return LocalDate.now(zone);
    }

    // ---- Public submission ---------------------------------------------------------------

    @Transactional
    public void submit(LeadSubmission s) {
        Lead lead = new Lead();
        lead.setFullName(Texts.clean(s.fullName()));
        lead.setEmail(Texts.normalizeEmail(s.email()));
        lead.setPhone(Texts.clean(s.phone()));
        lead.setCompany(Texts.clean(s.company()));
        lead.setWebsiteUrl(Texts.clean(s.websiteUrl()));
        lead.setMessage(Texts.clean(s.message()));
        String slug = Texts.clean(s.serviceSlug());
        if (slug != null) {
            ServiceOffering service = services.findBySlug(slug).filter(ServiceOffering::isPublished)
                    .orElseThrow(() -> ApiException.field("serviceSlug", "Choose a service from the list."));
            lead.setService(service);
        }
        lead.setSourcePage(Texts.clip(s.sourcePage(), 255));
        lead.setSourceCta(Texts.clip(s.sourceCta(), 120));
        lead.setReferrer(Texts.clip(s.referrer(), 500));
        lead.setUtmSource(Texts.clip(s.utmSource(), 120));
        lead.setUtmMedium(Texts.clip(s.utmMedium(), 120));
        lead.setUtmCampaign(Texts.clip(s.utmCampaign(), 120));
        lead.setStatus(LeadStatus.NEW);
        leads.save(lead);
        // Delivered after commit, so the lead is stored even if email fails.
        events.publishEvent(LeadCreatedEvent.from(lead));
    }

    // ---- Admin ---------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<LeadDto> list(LeadFilter filter, int page, int size, String sort) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                parseSort(sort));
        LocalDate today = today();
        return leads.findAll(specification(filter), pageable).map(l -> LeadDto.from(l, today));
    }

    @Transactional(readOnly = true)
    public List<Lead> export(LeadFilter filter, String sort) {
        return leads.findAll(specification(filter), PageRequest.of(0, MAX_EXPORT_ROWS, parseSort(sort)))
                .getContent();
    }

    @Transactional(readOnly = true)
    public LeadDto get(long id) {
        return LeadDto.from(find(id), today());
    }

    /**
     * Partial update. Only the keys present in the body change; sending a key
     * with null clears it (assignee or follow-up date).
     */
    @Transactional
    public LeadDto update(long id, Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            throw ApiException.badRequest("Nothing to update.");
        }
        Set<String> allowed = Set.of("status", "assignedToId", "followUpOn");
        for (String key : body.keySet()) {
            if (!allowed.contains(key)) {
                throw ApiException.field(key, "This field cannot be changed here.");
            }
        }
        Lead lead = find(id);
        if (body.containsKey("status")) {
            Object value = body.get("status");
            try {
                lead.setStatus(LeadStatus.valueOf(String.valueOf(value).toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw ApiException.field("status", "Choose a valid status.");
            }
        }
        if (body.containsKey("assignedToId")) {
            Object value = body.get("assignedToId");
            if (value == null) {
                lead.setAssignedTo(null);
            } else {
                long userId;
                try {
                    userId = Long.parseLong(String.valueOf(value));
                } catch (NumberFormatException e) {
                    throw ApiException.field("assignedToId", "Choose a team member.");
                }
                User user = users.findById(userId).filter(User::isActive)
                        .orElseThrow(() -> ApiException.field("assignedToId", "Choose an active team member."));
                lead.setAssignedTo(user);
            }
        }
        if (body.containsKey("followUpOn")) {
            Object value = body.get("followUpOn");
            if (value == null || String.valueOf(value).isBlank()) {
                lead.setFollowUpOn(null);
            } else {
                try {
                    lead.setFollowUpOn(LocalDate.parse(String.valueOf(value)));
                } catch (DateTimeParseException e) {
                    throw ApiException.field("followUpOn", "Enter a date as YYYY-MM-DD.");
                }
            }
        }
        return LeadDto.from(leads.save(lead), today());
    }

    @Transactional
    public void delete(long id) {
        leads.delete(find(id));
    }

    @Transactional(readOnly = true)
    public List<NoteDto> notes(long leadId) {
        find(leadId);
        return notes.findByLeadIdOrderByCreatedAtDescIdDesc(leadId).stream().map(NoteDto::from).toList();
    }

    @Transactional
    public NoteDto addNote(long leadId, String body, long authorId) {
        Lead lead = find(leadId);
        User author = users.findById(authorId).orElse(null);
        return NoteDto.from(notes.save(new LeadNote(lead, author, Texts.clean(body))));
    }

    @Transactional
    public void deleteNote(long leadId, long noteId) {
        notes.delete(notes.findByIdAndLeadId(noteId, leadId).orElseThrow(() -> ApiException.notFound("Note")));
    }

    private Lead find(long id) {
        return leads.findWithDetailsById(id).orElseThrow(() -> ApiException.notFound("Lead"));
    }

    // ---- Filtering -----------------------------------------------------------------------

    Sort parseSort(String sort) {
        String property = "createdAt";
        Sort.Direction direction = Sort.Direction.DESC;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String requested = SORTABLE.get(parts[0].strip());
            if (requested == null) {
                throw ApiException.field("sort", "The list cannot be sorted by that column.");
            }
            property = requested;
            if (parts.length > 1) {
                direction = "asc".equalsIgnoreCase(parts[1].strip()) ? Sort.Direction.ASC : Sort.Direction.DESC;
            }
        }
        return Sort.by(direction, property).and(Sort.by(Sort.Direction.DESC, "id"));
    }

    Specification<Lead> specification(LeadFilter f) {
        LocalDate today = today();
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            String q = Texts.clean(f.q());
            if (q != null) {
                String pattern = "%" + q.toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern, '\\'),
                        cb.like(cb.lower(root.get("email")), pattern, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.get("company"), "")), pattern, '\\'),
                        cb.like(cb.lower(root.get("message")), pattern, '\\')));
            }
            if (f.status() != null) {
                where.add(cb.equal(root.get("status"), f.status()));
            }
            String serviceId = Texts.clean(f.serviceId());
            if (serviceId != null) {
                if ("none".equals(serviceId)) {
                    where.add(cb.isNull(root.get("service")));
                } else {
                    where.add(cb.equal(root.get("service").get("id"), parseId(serviceId, "serviceId")));
                }
            }
            String assignedTo = Texts.clean(f.assignedTo());
            if (assignedTo != null) {
                if ("unassigned".equals(assignedTo)) {
                    where.add(cb.isNull(root.get("assignedTo")));
                } else {
                    where.add(cb.equal(root.get("assignedTo").get("id"), parseId(assignedTo, "assignedTo")));
                }
            }
            String source = Texts.clean(f.source());
            if (source != null) {
                where.add(cb.equal(LeadSources.expression(root, cb), source.toLowerCase(Locale.ROOT)));
            }
            if (f.from() != null) {
                where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), f.from().atStartOfDay(zone).toInstant()));
            }
            if (f.to() != null) {
                where.add(cb.lessThan(root.get("createdAt"), f.to().plusDays(1).atStartOfDay(zone).toInstant()));
            }
            if (Boolean.TRUE.equals(f.overdue())) {
                where.add(cb.lessThan(root.get("followUpOn"), today));
                where.add(root.get("status").in(LeadStatus.WON, LeadStatus.LOST).not());
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    private static long parseId(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw ApiException.field(field, "This value is not valid.");
        }
    }
}
