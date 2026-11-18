package com.trilanetech.api.lead;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LeadCsvTest {

    @Test
    void formulaCharactersAreNeutralised() {
        assertThat(LeadCsv.cell("=SUM(A1)")).isEqualTo("\"'=SUM(A1)\"");
        assertThat(LeadCsv.cell("+1 555")).isEqualTo("\"'+1 555\"");
        assertThat(LeadCsv.cell("-2")).isEqualTo("\"'-2\"");
        assertThat(LeadCsv.cell("@cmd")).isEqualTo("\"'@cmd\"");
        assertThat(LeadCsv.cell("\tx")).isEqualTo("\"'\tx\"");
    }

    @Test
    void quotesAreEscapedAndNullsAreEmpty() {
        assertThat(LeadCsv.cell("He said \"hi\", then left")).isEqualTo("\"He said \"\"hi\"\", then left\"");
        assertThat(LeadCsv.cell(null)).isEqualTo("\"\"");
        assertThat(LeadCsv.cell("plain")).isEqualTo("\"plain\"");
    }
}
