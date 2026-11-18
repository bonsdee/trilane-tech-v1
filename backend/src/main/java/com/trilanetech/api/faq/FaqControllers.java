package com.trilanetech.api.faq;

import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.ApiResponse;
import com.trilanetech.api.common.Texts;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

public final class FaqControllers {

    private FaqControllers() {}

    public record FaqDto(Long id, String question, String answer, int displayOrder, boolean published) {
        static FaqDto from(Faq f) {
            return new FaqDto(f.getId(), f.getQuestion(), f.getAnswer(), f.getDisplayOrder(), f.isPublished());
        }
    }

    public record FaqRequest(
            @NotBlank(message = "Enter the question.") @Size(max = 300, message = "Use at most 300 characters.") String question,
            @NotBlank(message = "Enter the answer.") @Size(max = 5000, message = "Use at most 5,000 characters.") String answer,
            @Min(value = 0, message = "Order must be 0 or more.") @Max(value = 10000, message = "Order is too large.") Integer displayOrder,
            Boolean published) {}

    @Service
    public static class FaqService {
        private final FaqRepository faqs;

        public FaqService(FaqRepository faqs) {
            this.faqs = faqs;
        }

        @Transactional(readOnly = true)
        public List<FaqDto> published() {
            return faqs.findByPublishedTrueOrderByDisplayOrderAscIdAsc().stream().map(FaqDto::from).toList();
        }

        @Transactional(readOnly = true)
        public List<FaqDto> all() {
            return faqs.findAllByOrderByDisplayOrderAscIdAsc().stream().map(FaqDto::from).toList();
        }

        @Transactional
        public FaqDto save(Long id, FaqRequest r) {
            Faq faq = id == null ? new Faq() : faqs.findById(id).orElseThrow(() -> ApiException.notFound("FAQ entry"));
            faq.setQuestion(Texts.clean(r.question()));
            faq.setAnswer(Texts.clean(r.answer()));
            faq.setDisplayOrder(r.displayOrder() == null ? 0 : r.displayOrder());
            faq.setPublished(r.published() == null || r.published());
            return FaqDto.from(faqs.save(faq));
        }

        @Transactional
        public void delete(long id) {
            faqs.delete(faqs.findById(id).orElseThrow(() -> ApiException.notFound("FAQ entry")));
        }
    }

    @RestController
    @RequestMapping("/api/v1/public/faqs")
    public static class PublicFaqController {
        private final FaqService service;

        public PublicFaqController(FaqService service) {
            this.service = service;
        }

        @GetMapping
        public ApiResponse<List<FaqDto>> list() {
            return ApiResponse.of(service.published());
        }
    }

    @RestController
    @RequestMapping("/api/v1/admin/faqs")
    public static class AdminFaqController {
        private final FaqService service;

        public AdminFaqController(FaqService service) {
            this.service = service;
        }

        @GetMapping
        public ApiResponse<List<FaqDto>> list() {
            return ApiResponse.of(service.all());
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<FaqDto> create(@Valid @RequestBody FaqRequest body) {
            return ApiResponse.of(service.save(null, body));
        }

        @PutMapping("/{id}")
        public ApiResponse<FaqDto> update(@PathVariable long id, @Valid @RequestBody FaqRequest body) {
            return ApiResponse.of(service.save(id, body));
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable long id) {
            service.delete(id);
        }
    }
}
