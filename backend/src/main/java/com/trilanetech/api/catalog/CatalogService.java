package com.trilanetech.api.catalog;

import com.trilanetech.api.catalog.ServiceDtos.CategoryGroup;
import com.trilanetech.api.catalog.ServiceDtos.ServiceDto;
import com.trilanetech.api.catalog.ServiceDtos.ServiceRequest;
import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.Texts;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Services, pricing and bundles. */
@Service
public class CatalogService {

    private static final Map<ServiceOffering.Category, String> LABELS = Map.of(
            ServiceOffering.Category.ONE_TIME, "One-time projects",
            ServiceOffering.Category.RETAINER, "Ongoing retainers",
            ServiceOffering.Category.BUNDLE, "Recommended bundles");

    private final ServiceOfferingRepository services;

    public CatalogService(ServiceOfferingRepository services) {
        this.services = services;
    }

    @Transactional(readOnly = true)
    public List<CategoryGroup> publishedByCategory() {
        List<ServiceOffering> published = services.findByPublishedTrueOrderByDisplayOrderAscIdAsc();
        List<CategoryGroup> groups = new ArrayList<>();
        for (ServiceOffering.Category category : ServiceOffering.Category.values()) {
            List<ServiceDto> inGroup = published.stream()
                    .filter(s -> s.getCategory() == category)
                    .map(ServiceDto::from)
                    .toList();
            groups.add(new CategoryGroup(category, LABELS.get(category), inGroup));
        }
        return groups;
    }

    @Transactional(readOnly = true)
    public List<ServiceDto> all() {
        return services.findAllByOrderByDisplayOrderAscIdAsc().stream().map(ServiceDto::from).toList();
    }

    @Transactional(readOnly = true)
    public ServiceDto get(long id) {
        return ServiceDto.from(find(id));
    }

    @Transactional
    public ServiceDto create(ServiceRequest request) {
        if (services.existsBySlug(request.slug())) {
            throw ApiException.field("slug", "Another service already uses this URL name.");
        }
        ServiceOffering service = new ServiceOffering();
        apply(service, request);
        return ServiceDto.from(services.save(service));
    }

    @Transactional
    public ServiceDto update(long id, ServiceRequest request) {
        ServiceOffering service = find(id);
        if (services.existsBySlugAndIdNot(request.slug(), id)) {
            throw ApiException.field("slug", "Another service already uses this URL name.");
        }
        apply(service, request);
        return ServiceDto.from(services.save(service));
    }

    /** Leads and portfolio projects that pointed at the service keep existing, with the link cleared. */
    @Transactional
    public void delete(long id) {
        services.delete(find(id));
    }

    private ServiceOffering find(long id) {
        return services.findById(id).orElseThrow(() -> ApiException.notFound("Service"));
    }

    private void apply(ServiceOffering s, ServiceRequest r) {
        s.setSlug(r.slug());
        s.setName(Texts.clean(r.name()));
        s.setCategory(r.category());
        s.setPrice(r.price());
        s.setBillingPeriod(r.billingPeriod());
        s.setRegularPrice(r.regularPrice());
        s.setTimeline(Texts.clean(r.timeline()));
        s.setHours(r.hours());
        s.setSummary(Texts.clean(r.summary()));
        s.setIdealFor(Texts.clean(r.idealFor()));
        s.setDisplayOrder(r.displayOrder() == null ? 0 : r.displayOrder());
        s.setPublished(r.published() == null || r.published());
        List<ServiceItem> items = new ArrayList<>();
        if (r.items() != null) {
            int order = 1;
            for (var item : r.items()) {
                items.add(new ServiceItem(item.kind(), Texts.clean(item.text()), order++));
            }
        }
        s.replaceItems(items);
    }
}
