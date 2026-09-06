import puppeteer from 'puppeteer-core';

async function generatePdf() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const courseHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>La Révolution Française (1789-1799)</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
          color: #1a202c;
        }
        h1 {
          color: #b45309;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 8px;
        }
        h2 {
          color: #1e3a8a;
          margin-top: 24px;
        }
        .intro {
          font-size: 1.1em;
          background: #fef3c7;
          padding: 12px;
          border-radius: 6px;
        }
        ul {
          margin: 10px 0 20px 20px;
        }
        li {
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <h1>La Révolution Française et la Naissance d'un Ordre Nouveau</h1>
      <p class="intro">
        En 1789, la France traverse une crise financière, politique et sociale profonde qui conduit à la fin de l'Ancien Régime et à l'affirmation de la souveraineté nationale.
      </p>

      <h2>I. La Rupture de l'Été 1789</h2>
      <p>
        Les États généraux convoqués par Louis XVI s'ouvrent le 5 mai 1789. Les députés du Tiers-État se proclament Assemblée nationale lors du serment du Jeu de Paume le 20 juin 1789. La prise de la Bastille le 14 juillet 1789 marque l'entrée du peuple parisien dans la révolution.
      </p>
      <ul>
        <li>L'abolition des privilèges et du régime féodal est votée dans la nuit du 4 août 1789.</li>
        <li>La Déclaration des Droits de l'Homme et du Citoyen est adoptée le 26 août 1789.</li>
        <li>Les principes d'égalité devant la loi et de liberté individuelle deviennent la base de la société.</li>
      </ul>

      <h2>II. De la Monarchie Constitutionnelle à la République</h2>
      <p>
        La Constitution de 1791 fonde une monarchie constitutionnelle où le roi partage le pouvoir avec l'Assemblée législative. Cependant, la tentative de fuite du roi à Varennes brise la confiance populaire. En septembre 1792, après la prise des Tuileries, la Première République est officiellement proclamée.
      </p>
      <ul>
        <li>La proclamation de la Première République a lieu le 22 septembre 1792.</li>
        <li>La Convention nationale est marquée par l'opposition entre Girondins et Montagnards.</li>
        <li>La Terreur est instaurée en 1793 sous la direction de Maximilien de Robespierre.</li>
      </ul>

      <h2>III. Les Héritages Majeurs de la Révolution</h2>
      <p>
        La Révolution transforme durablement l'organisation administrative, juridique et économique de la nation. Elle crée les départements pour unifier le territoire et instaure l'état civil laïcisé.
      </p>
      <ul>
        <li>Création des départements en 1790 pour décentraliser et uniformiser l'administration.</li>
        <li>Unification des poids et mesures avec l'adoption du système métrique décimal.</li>
        <li>Séparation de l'Église et de l'État avec la constitution civile du clergé.</li>
      </ul>
    </body>
    </html>
  `;

  await page.setContent(courseHtml, { waitUntil: 'networkidle0' });
  const pdfPath = 'C:\\REVIZO 2.0\\cours_histoire_revolution.pdf';
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true
  });

  console.log('PDF generated successfully at:', pdfPath);
  await browser.close();
}

generatePdf().catch(console.error);
