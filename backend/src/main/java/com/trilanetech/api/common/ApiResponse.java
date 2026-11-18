package com.trilanetech.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import org.springframework.data.domain.Page;

/** Success envelope: {@code { "data": ..., "meta": ... }}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(T data, PageMeta meta) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<List<T>> page(Page<T> page) {
        return new ApiResponse<>(page.getContent(), PageMeta.from(page));
    }

    public record PageMeta(int page, int size, long totalElements, int totalPages) {
        static PageMeta from(Page<?> page) {
            return new PageMeta(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
        }
    }
}
