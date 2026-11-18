package com.trilanetech.api.lead;

import com.trilanetech.api.auth.CurrentUser;
import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.ApiResponse;
import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.common.RateLimiter;
import com.trilanetech.api.lead.LeadDtos.LeadDto;
import com.trilanetech.api.lead.LeadDtos.LeadFilter;
import com.trilanetech.api.lead.LeadDtos.LeadSubmission;
import com.trilanetech.api.lead.LeadDtos.NoteDto;
import com.trilanetech.api.lead.LeadDtos.NoteRequest;
import com.trilanetech.api.lead.LeadDtos.SubmissionReceived;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

public final class LeadControllers {

    private LeadControllers() {}

    @RestController
    @RequestMapping("/api/v1/public/leads")
    public static class PublicLeadController {
        private static final Logger log = LoggerFactory.getLogger(PublicLeadController.class);

        private final LeadService leads;
        private final RateLimiter rateLimiter;

        public PublicLeadController(LeadService leads, RateLimiter rateLimiter) {
            this.leads = leads;
            this.rateLimiter = rateLimiter;
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<SubmissionReceived> submit(@Valid @RequestBody LeadSubmission body,
                                                      HttpServletRequest request) {
            if (!rateLimiter.tryAcquire(request.getRemoteAddr())) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                        "You've sent several messages in a short time. Please wait a while and try again.");
            }
            if (body.nickname() != null && !body.nickname().isBlank()) {
                // Looks like a bot. Answer as if it worked so it does not retry; store nothing.
                log.info("Contact form spam trap triggered; submission discarded.");
                return ApiResponse.of(new SubmissionReceived(true));
            }
            leads.submit(body);
            return ApiResponse.of(new SubmissionReceived(true));
        }
    }

    @RestController
    @RequestMapping("/api/v1/admin/leads")
    public static class AdminLeadController {
        private final LeadService leads;
        private final ZoneId zone;

        public AdminLeadController(LeadService leads, AppProperties props) {
            this.leads = leads;
            this.zone = ZoneId.of(props.timezone());
        }

        @GetMapping
        public ApiResponse<List<LeadDto>> list(
                @RequestParam(required = false) String q,
                @RequestParam(required = false) LeadStatus status,
                @RequestParam(required = false) String serviceId,
                @RequestParam(required = false) String assignedTo,
                @RequestParam(required = false) String source,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                @RequestParam(required = false) Boolean overdue,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "20") int size,
                @RequestParam(required = false) String sort) {
            LeadFilter filter = new LeadFilter(q, status, serviceId, assignedTo, source, from, to, overdue);
            return ApiResponse.page(leads.list(filter, page, size, sort));
        }

        @GetMapping("/export")
        public ResponseEntity<byte[]> export(
                @RequestParam(required = false) String q,
                @RequestParam(required = false) LeadStatus status,
                @RequestParam(required = false) String serviceId,
                @RequestParam(required = false) String assignedTo,
                @RequestParam(required = false) String source,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                @RequestParam(required = false) Boolean overdue,
                @RequestParam(required = false) String sort) {
            LeadFilter filter = new LeadFilter(q, status, serviceId, assignedTo, source, from, to, overdue);
            byte[] csv = LeadCsv.write(leads.export(filter, sort), zone).getBytes(StandardCharsets.UTF_8);
            String filename = "trilane-leads-" + LocalDate.now(zone) + ".csv";
            return ResponseEntity.ok()
                    .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.attachment().filename(filename).build().toString())
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .body(csv);
        }

        @GetMapping("/{id}")
        public ApiResponse<LeadDto> get(@PathVariable long id) {
            return ApiResponse.of(leads.get(id));
        }

        @PatchMapping("/{id}")
        public ApiResponse<LeadDto> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
            return ApiResponse.of(leads.update(id, body));
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable long id) {
            leads.delete(id);
        }

        @GetMapping("/{id}/notes")
        public ApiResponse<List<NoteDto>> notes(@PathVariable long id) {
            return ApiResponse.of(leads.notes(id));
        }

        @PostMapping("/{id}/notes")
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<NoteDto> addNote(@PathVariable long id, @Valid @RequestBody NoteRequest body,
                                            Authentication authentication) {
            return ApiResponse.of(leads.addNote(id, body.body(), CurrentUser.id(authentication)));
        }

        @DeleteMapping("/{id}/notes/{noteId}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteNote(@PathVariable long id, @PathVariable long noteId) {
            leads.deleteNote(id, noteId);
        }
    }
}
