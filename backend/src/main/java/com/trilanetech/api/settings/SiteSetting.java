package com.trilanetech.api.settings;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** A named switch or value, such as the pilot offer settings. */
@Entity
@Table(name = "site_settings")
public class SiteSetting extends BaseEntity {

    @Column(name = "key", nullable = false, length = 100)
    private String key;

    @Column(nullable = false, length = 1000)
    private String value;

    protected SiteSetting() {}

    public SiteSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
