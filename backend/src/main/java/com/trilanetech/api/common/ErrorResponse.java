package com.trilanetech.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/** Error envelope: {@code { "error": { "code", "message", "fields" } }}. */
public record ErrorResponse(Body error) {

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public record Body(String code, String message, Map<String, String> fields) {}

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(new Body(code, message, null));
    }

    public static ErrorResponse of(String code, String message, Map<String, String> fields) {
        return new ErrorResponse(new Body(code, message, fields));
    }
}
