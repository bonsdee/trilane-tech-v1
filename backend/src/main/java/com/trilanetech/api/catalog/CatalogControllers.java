package com.trilanetech.api.catalog;

import com.trilanetech.api.catalog.ServiceDtos.CategoryGroup;
import com.trilanetech.api.catalog.ServiceDtos.ServiceDto;
import com.trilanetech.api.catalog.ServiceDtos.ServiceRequest;
import com.trilanetech.api.common.ApiResponse;
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

public final class CatalogControllers {

    private CatalogControllers() {}

    @RestController
    @RequestMapping("/api/v1/public/services")
    public static class PublicServicesController {
        private final CatalogService catalog;

        public PublicServicesController(CatalogService catalog) {
            this.catalog = catalog;
        }

        @GetMapping
        public ApiResponse<List<CategoryGroup>> list() {
            return ApiResponse.of(catalog.publishedByCategory());
        }
    }

    @RestController
    @RequestMapping("/api/v1/admin/services")
    public static class AdminServicesController {
        private final CatalogService catalog;

        public AdminServicesController(CatalogService catalog) {
            this.catalog = catalog;
        }

        @GetMapping
        public ApiResponse<List<ServiceDto>> list() {
            return ApiResponse.of(catalog.all());
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<ServiceDto> create(@Valid @RequestBody ServiceRequest body) {
            return ApiResponse.of(catalog.create(body));
        }

        @GetMapping("/{id}")
        public ApiResponse<ServiceDto> get(@PathVariable long id) {
            return ApiResponse.of(catalog.get(id));
        }

        @PutMapping("/{id}")
        public ApiResponse<ServiceDto> update(@PathVariable long id, @Valid @RequestBody ServiceRequest body) {
            return ApiResponse.of(catalog.update(id, body));
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable long id) {
            catalog.delete(id);
        }
    }
}
