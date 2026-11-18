package com.trilanetech.api.file;

import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.AppProperties;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Accepts image uploads after checking their actual content, not just the name. */
@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final StoredFileRepository files;
    private final FileStorage storage;
    private final AppProperties props;

    public FileService(StoredFileRepository files, FileStorage storage, AppProperties props) {
        this.files = files;
        this.storage = storage;
        this.props = props;
    }

    public record FileDto(Long id, String url, String contentType, long sizeBytes, String originalName) {
        static FileDto from(StoredFile f) {
            return new FileDto(f.getId(), urlFor(f.getId()), f.getContentType(), f.getSizeBytes(), f.getOriginalName());
        }
    }

    /** Public address of a stored file, relative to the API host. */
    public static String urlFor(Long id) {
        return id == null ? null : "/api/v1/files/" + id;
    }

    @Transactional
    public FileDto upload(MultipartFile upload, Long userId) {
        if (upload == null || upload.isEmpty()) {
            throw ApiException.field("file", "Choose an image file to upload.");
        }
        if (upload.getSize() > props.uploads().maxBytes()) {
            throw ApiException.field("file", "Images must be 5 MB or smaller.");
        }
        byte[] bytes;
        try {
            bytes = upload.getBytes();
        } catch (IOException e) {
            throw ApiException.field("file", "The file could not be read. Please try again.");
        }
        ImageType type = ImageType.detect(bytes);
        if (type == null) {
            throw ApiException.field("file", "Only JPEG, PNG or WebP images can be uploaded.");
        }
        String key = UUID.randomUUID() + "." + type.extension;
        try {
            storage.store(key, bytes);
        } catch (IOException e) {
            log.error("Could not store upload: {}", e.toString());
            throw new IllegalStateException("Could not store the file", e);
        }
        String name = upload.getOriginalFilename() == null ? "image" : upload.getOriginalFilename();
        name = name.replaceAll("[\\r\\n\\\\/]", "_");
        if (name.length() > 255) {
            name = name.substring(name.length() - 255);
        }
        StoredFile saved = files.save(new StoredFile(key, name, type.contentType, bytes.length, userId));
        return FileDto.from(saved);
    }

    public record Loaded(StoredFile file, Resource resource) {}

    @Transactional(readOnly = true)
    public Loaded load(long id) {
        StoredFile file = files.findById(id).orElseThrow(() -> ApiException.notFound("File"));
        Resource resource = storage.load(file.getStorageKey());
        if (resource == null) {
            throw ApiException.notFound("File");
        }
        return new Loaded(file, resource);
    }

    /** Rejects references to images that do not exist. */
    @Transactional(readOnly = true)
    public void requireExists(Long id, String field) {
        if (id != null && !files.existsById(id)) {
            throw ApiException.field(field, "That image no longer exists. Upload it again.");
        }
    }

    enum ImageType {
        JPEG("image/jpeg", "jpg"), PNG("image/png", "png"), WEBP("image/webp", "webp");

        final String contentType;
        final String extension;

        ImageType(String contentType, String extension) {
            this.contentType = contentType;
            this.extension = extension;
        }

        /** Identifies the image by its leading "magic" bytes. */
        static ImageType detect(byte[] b) {
            if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
                return JPEG;
            }
            if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                    && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
                return PNG;
            }
            if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
                return WEBP;
            }
            return null;
        }
    }
}
