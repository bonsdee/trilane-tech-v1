package com.trilanetech.api.lead;

import com.trilanetech.api.common.BaseEntity;
import com.trilanetech.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** An internal note on a lead. Never shown publicly. */
@Entity
@Table(name = "lead_notes")
public class LeadNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    protected LeadNote() {}

    public LeadNote(Lead lead, User author, String body) {
        this.lead = lead;
        this.author = author;
        this.body = body;
    }

    public Lead getLead() { return lead; }
    public User getAuthor() { return author; }
    public String getBody() { return body; }
}
