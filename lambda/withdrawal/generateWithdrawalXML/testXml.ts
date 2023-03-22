export const testXml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE pepkbd3 SYSTEM "http://peparchive.org/pepa1dtd/pepkbd3.dtd">
<pepkbd3 lang="pt">
    <meta>
        <adldata>
            <adlfield>manuscript-id</adlfield>
            <adlval>IJP-22-211.r2</adlval>
        </adldata>
    </meta>
    <artinfo arttype="ART" j="IJPOPEN" issuetitle="Original Articles">
        <arttitle lang="en">Love and Idealization: A Test Sample File</arttitle>
    </artinfo>
    <abs><p lang="en">This article is a test file. The third version.  Still a few more minutes later.</p></abs>
    <body>
        <p>Love, Hate for testing only.</p>
    </body>
    <bib>
        <h1 id="H0023">References</h1>
        <be id="B001">The reference from the author's master's thesis is missing as instructed in the instructions for authors.</be>
    </bib>
    <appxs>
    <figure id="G002">
      <graphic source="IJPOPEN.008.0015A.FIG002"/>
    </figure>
    <pb>
      <n>22</n>
    </pb>
  </appxs>
</pepkbd3>
    `;

export const outputXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pepkbd3 SYSTEM "http://peparchive.org/pepa1dtd/pepkbd3.dtd">
<pepkbd3 lang="pt">
    <meta>
        <adldata>
            <adlfield>manuscript-id</adlfield>
            <adlval>IJP-22-211.r2</adlval>
        </adldata>
    </meta>
    <artinfo arttype="ART" j="IJPOPEN" issuetitle="Original Articles">
        <arttitle lang="en">Love and Idealization: A Test Sample File</arttitle>
    </artinfo>
    <abs><p lang="en">This article is a test file. The third version.  Still a few more minutes later.</p></abs>
    <body>
        <p>Test removal message</p>
    </body>
</pepkbd3>
    `;
