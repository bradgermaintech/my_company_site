import {
  Document,
  Link,
  Page,
  pdf,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import type { TailoredResume } from "@/lib/resume-tailoring/schemas";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#172033",
    lineHeight: 1.38
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#101828" },
  headline: { marginTop: 4, fontSize: 10.5, color: "#315fc4" },
  contact: { marginTop: 7, flexDirection: "row", flexWrap: "wrap", gap: 8, color: "#475467" },
  section: { marginTop: 14 },
  heading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#315fc4",
    borderBottomWidth: 0.8,
    borderBottomColor: "#d7deea",
    paddingBottom: 3,
    marginBottom: 6
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  strong: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#667085" },
  item: { marginBottom: 8 },
  bulletRow: { flexDirection: "row", paddingLeft: 4, marginTop: 2 },
  bullet: { width: 10 },
  bulletText: { flex: 1 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  skill: { borderWidth: 0.6, borderColor: "#cbd5e1", paddingHorizontal: 5, paddingVertical: 2 },
  link: { color: "#315fc4", textDecoration: "none" }
});

function ResumeDocument({ resume }: { resume: TailoredResume }) {
  const contactItems = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedIn,
    resume.contact.website
  ].filter((value): value is string => Boolean(value));

  return (
    <Document title={`${resume.contact.fullName || "Candidate"} - Tailored Resume`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{resume.contact.fullName || "Candidate"}</Text>
        <Text style={styles.headline}>{resume.headline}</Text>
        <View style={styles.contact}>
          {contactItems.map((item) =>
            item.startsWith("http") ? (
              <Link key={item} src={item} style={styles.link}>{item}</Link>
            ) : (
              <Text key={item}>{item}</Text>
            )
          )}
        </View>

        <PdfSection title="Professional summary">
          <Text>{resume.professionalSummary}</Text>
        </PdfSection>

        <PdfSection title="Core skills">
          <View style={styles.skills}>
            {resume.coreSkills.map((skill) => <Text key={skill} style={styles.skill}>{skill}</Text>)}
          </View>
        </PdfSection>

        {resume.experience.length ? (
          <PdfSection title="Experience">
            {resume.experience.map((item, index) => (
              <View key={`${item.employer}-${item.title}-${index}`} style={styles.item} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.strong}>{item.title}</Text>
                  <Text style={styles.muted}>{item.startDate} - {item.endDate}</Text>
                </View>
                <View style={styles.row}>
                  <Text>{item.employer}</Text>
                  {item.location ? <Text style={styles.muted}>{item.location}</Text> : null}
                </View>
                {item.bullets.map((bullet, bulletIndex) => (
                  <View key={`${bullet}-${bulletIndex}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </PdfSection>
        ) : null}

        {resume.projects.length ? (
          <PdfSection title="Projects">
            {resume.projects.map((project, index) => (
              <View key={`${project.name}-${index}`} style={styles.item} wrap={false}>
                <Text style={styles.strong}>{project.name}</Text>
                <Text>{project.description}</Text>
                {project.technologies.length ? <Text style={styles.muted}>{project.technologies.join(" | ")}</Text> : null}
              </View>
            ))}
          </PdfSection>
        ) : null}

        {resume.education.length ? (
          <PdfSection title="Education">
            {resume.education.map((item, index) => (
              <View key={`${item.institution}-${index}`} style={styles.item} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.strong}>{item.degree}{item.field ? `, ${item.field}` : ""}</Text>
                  <Text style={styles.muted}>{[item.startDate, item.endDate].filter(Boolean).join(" - ")}</Text>
                </View>
                <Text>{item.institution}</Text>
              </View>
            ))}
          </PdfSection>
        ) : null}

        {resume.certifications.length ? (
          <PdfSection title="Certifications">
            {resume.certifications.map((item) => <Text key={item}>• {item}</Text>)}
          </PdfSection>
        ) : null}
      </Page>
    </Document>
  );
}

function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

export async function createResumePdfBlob(resume: TailoredResume) {
  return pdf(<ResumeDocument resume={resume} />).toBlob();
}
