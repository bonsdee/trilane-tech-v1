package com.trilanetech.api.file;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Metadata for an uploaded image. The bytes live in {@link FileStorage}. */
@Entity
@Table(name = "stored_files")
public class StoredFile extends BaseEntity {

    @Column(name = "storage_key", nullable = false, length = 100)
    private String storageKey;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    protected StoredFile() {}

    public StoredFile(String storageKey, String originalName, String contentType, long sizeBytes, Long uploadedBy) {
        this.storageKey = storageKey;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.uploadedBy = uploadedBy;
    }

    public String getStorageKey() { return storageKey; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public Long getUploadedBy() { return uploadedBy; }
}
