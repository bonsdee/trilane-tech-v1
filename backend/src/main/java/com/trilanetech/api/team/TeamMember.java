package com.trilanetech.api.team;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A public team profile. Kept separate from login accounts on purpose, so a
 * bio can be edited without touching anyone's account.
 */
@Entity
@Table(name = "team_members")
public class TeamMember extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(length = 120)
    private String position;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(name = "photo_file_id")
    private Long photoFileId;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean published = true;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Long getPhotoFileId() { return photoFileId; }
    public void setPhotoFileId(Long photoFileId) { this.photoFileId = photoFileId; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
