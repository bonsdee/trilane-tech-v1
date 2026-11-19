package com.trilanetech.api.portfolio;

import com.trilanetech.api.catalog.ServiceOfferingRepository;
import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.Texts;
import com.trilanetech.api.file.FileService;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectDetail;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectRequest;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectSummary;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {

    private final PortfolioProjectRepository projects;
    private final ServiceOfferingRepository services;
    private final FileService files;

    public PortfolioService(PortfolioProjectRepository projects, ServiceOfferingRepository services, FileService files) {
        this.projects = projects;
        this.services = services;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public List<ProjectSummary> published() {
        return projects.findByPublishedTrueOrderByDisplayOrderAscIdAsc().stream().map(ProjectSummary::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDetail publishedBySlug(String slug) {
        return projects.findBySlugAndPublishedTrue(slug).map(ProjectDetail::from)
                .orElseThrow(() -> ApiException.notFound("Project"));
    }

    @Transactional(readOnly = true)
    public boolean anyPublished() {
        return projects.existsByPublishedTrue();
    }

    @Transactional(readOnly = true)
    public List<ProjectSummary> all() {
        return projects.findAllByOrderByDisplayOrderAscIdAsc().stream().map(ProjectSummary::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDetail get(long id) {
        return ProjectDetail.from(find(id));
    }

    @Transactional
    public ProjectDetail create(ProjectRequest request) {
        if (projects.existsBySlug(request.slug())) {
            throw ApiException.field("slug", "Another project already uses this URL name.");
        }
        PortfolioProject project = new PortfolioProject();
        apply(project, request);
        return ProjectDetail.from(projects.save(project));
    }

    @Transactional
    public ProjectDetail update(long id, ProjectRequest request) {
        PortfolioProject project = find(id);
        if (projects.existsBySlugAndIdNot(request.slug(), id)) {
            throw ApiException.field("slug", "Another project already uses this URL name.");
        }
        apply(project, request);
        return ProjectDetail.from(projects.save(project));
    }

    @Transactional
    public void delete(long id) {
        projects.delete(find(id));
    }

    private PortfolioProject find(long id) {
        return projects.findWithDetailsById(id).orElseThrow(() -> ApiException.notFound("Project"));
    }

    private void apply(PortfolioProject p, ProjectRequest r) {
        files.requireExists(r.coverFileId(), "coverFileId");
        p.setSlug(r.slug());
        p.setTitle(Texts.clean(r.title()));
        p.setClientName(Texts.clean(r.clientName()));
        p.setSummary(Texts.clean(r.summary()));
        p.setDescription(Texts.clean(r.description()));
        p.setService(r.serviceId() == null ? null : services.findById(r.serviceId())
                .orElseThrow(() -> ApiException.field("serviceId", "That service no longer exists.")));
        p.setProjectUrl(Texts.clean(r.projectUrl()));
        p.setCoverFileId(r.coverFileId());
        p.setCompletedOn(r.completedOn());
        p.setDisplayOrder(r.displayOrder() == null ? 0 : r.displayOrder());
        p.setPublished(Boolean.TRUE.equals(r.published()));
        p.setConcept(Boolean.TRUE.equals(r.concept()));
        List<PortfolioImage> images = new ArrayList<>();
        if (r.images() != null) {
            int order = 1;
            for (var image : r.images()) {
                files.requireExists(image.fileId(), "images");
                images.add(new PortfolioImage(image.fileId(), Texts.clean(image.altText()), order++));
            }
        }
        p.replaceImages(images);
    }
}
