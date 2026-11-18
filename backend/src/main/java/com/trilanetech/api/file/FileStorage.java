package com.trilanetech.api.file;

import java.io.IOException;
import org.springframework.core.io.Resource;

/**
 * Where uploaded bytes are kept. The first version stores them on local disk
 * ({@link LocalDiskFileStorage}); a cloud implementation (for example S3 or
 * Cloudflare R2) can replace it without touching the rest of the code.
 */
public interface FileStorage {

    void store(String key, byte[] content) throws IOException;

    /** Returns the stored bytes, or null if nothing is stored under the key. */
    Resource load(String key);

    void delete(String key) throws IOException;
}
