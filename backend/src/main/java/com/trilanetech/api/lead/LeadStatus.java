package com.trilanetech.api.lead;

public enum LeadStatus {
    NEW("New"),
    CONTACTED("Contacted"),
    QUALIFIED("Qualified"),
    PROPOSAL_SENT("Proposal Sent"),
    WON("Won"),
    LOST("Lost");

    private final String label;

    LeadStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Won and Lost leads no longer need follow-up. */
    public boolean isClosed() {
        return this == WON || this == LOST;
    }
}
