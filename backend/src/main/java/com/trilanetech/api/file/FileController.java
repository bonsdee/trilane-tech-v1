package com.trilanetech.api.file;

import com.trilanetech.api.auth.CurrentUser;
import com.trilanetech.api.common.ApiResponse;
import java.time.Duration;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(path = "/api/v1/admin/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FileService.FileDto> upload(@RequestParam(name = "file", required = false) MultipartFile file,
                                                   Authentication authentication) {
        return ApiResponse.of(fileService.upload(file, CurrentUser.id(authentication)));
    }

    @GetMapping("/api/v1/files/{id}")
    public ResponseEntity<Resource> serve(@PathVariable long id) {
        FileService.Loaded loaded = fileService.load(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(loaded.file().getContentType()))
                .contentLength(loaded.file().getSizeBytes())
                // Stored names never change, so images can be cached for a long time.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic().immutable())
                .header("Cross-Origin-Resource-Policy", "cross-origin")
                .body(loaded.resource());
    }
}
