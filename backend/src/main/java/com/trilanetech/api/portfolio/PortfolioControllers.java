package com.trilanetech.api.portfolio;

import com.trilanetech.api.common.ApiResponse;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectDetail;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectRequest;
import com.trilanetech.api.portfolio.PortfolioDtos.ProjectSummary;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

public final class PortfolioControllers {

    private PortfolioControllers() {}

    @RestController
    @RequestMapping("/api/v1/public/portfolio")
    public static class PublicPortfolioController {
        private final PortfolioService portfolio;

        public PublicPortfolioController(PortfolioService portfolio) {
            this.portfolio = portfolio;
        }

        @GetMapping
        public ApiResponse<List<ProjectSummary>> list() {
            return ApiResponse.of(portfolio.published());
        }

        @GetMapping("/{slug}")
        public ApiResponse<ProjectDetail> get(@PathVariable String slug) {
            return ApiResponse.of(portfolio.publishedBySlug(slug));
        }
    }

    @RestController
    @RequestMapping("/api/v1/admin/portfolio")
    public static class AdminPortfolioController {
        private final PortfolioService portfolio;

        public AdminPortfolioController(PortfolioService portfolio) {
            this.portfolio = portfolio;
        }

        @GetMapping
        public ApiResponse<List<ProjectSummary>> list() {
            return ApiResponse.of(portfolio.all());
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<ProjectDetail> create(@Valid @RequestBody ProjectRequest body) {
            return ApiResponse.of(portfolio.create(body));
        }

        @GetMapping("/{id}")
        public ApiResponse<ProjectDetail> get(@PathVariable long id) {
            return ApiResponse.of(portfolio.get(id));
        }

        @PutMapping("/{id}")
        public ApiResponse<ProjectDetail> update(@PathVariable long id, @Valid @RequestBody ProjectRequest body) {
            return ApiResponse.of(portfolio.update(id, body));
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable long id) {
            portfolio.delete(id);
        }
    }
}
