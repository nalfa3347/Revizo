import {
  UserProfile,
  UserProgress,
  Subject,
  Course,
  CourseConcept,
  Revision,
  Quiz,
  AppNotification,
  AppSettings
} from '../../types';

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'light',
  animationsEnabled: true,
  language: 'fr',
  notificationsRevision: true,
  notificationsDailyReminders: true,
  notificationsRewards: true
};

export const INITIAL_PROFILE: UserProfile = {
  id: 'usr-demo-001',
  email: 'nasser@revizo.app',
  phone: '0612345678',
  displayName: 'Nasser',
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  gradeLevel: '3e',
  joinedAt: '2026-08-15T08:00:00Z'
};

export interface MockAuthAccount {
  user: UserProfile;
  passwords: string[];
}

export const INITIAL_AUTH_ACCOUNTS: MockAuthAccount[] = [
  {
    user: INITIAL_PROFILE,
    passwords: ['Password123!', 'revizo2026', 'azerty123']
  }
];

export const INITIAL_PROGRESS: UserProgress = {
  userId: 'usr-demo-001',
  totalXp: 1740,
  level: 8,
  xpToNextLevel: 260,
  currentStreak: 12,
  longestStreak: 14,
  diamondsBalance: 24,
  energyBalance: 3, // 3 énergies max
  dailyGoalMinutes: 15,
  dailyGoalProgressMinutes: 10, // 70% (reste 5 minutes)
  lastActivityDate: new Date().toISOString().split('T')[0],
  weeklyDays: [true, true, true, true, true, true, false] // L, M, M, J, V, S complétés, D restant
};

export const SUBJECTS_FIXTURES: Subject[] = [
  { id: 'sbj-math', name: 'Mathématiques', color: '#EA580C', icon: 'Calculator', masteryScore: 78, level: 6 },
  { id: 'sbj-fr', name: 'Français', color: '#10B981', icon: 'BookOpen', masteryScore: 64, level: 5 },
  { id: 'sbj-sci', name: 'Sciences', color: '#8B5CF6', icon: 'FlaskConical', masteryScore: 42, level: 3 }
];

export const COURSES_FIXTURES: Course[] = [
  {
    id: 'crs-math-02',
    userId: 'usr-demo-001',
    subjectId: 'sbj-math',
    subjectName: 'Mathématiques',
    title: 'Les équations du second degré',
    summary: 'Résolution par discriminant delta, forme canonique, factorisation et interprétation graphique des racines.',
    difficulty: 3,
    status: 'ready',
    conceptsCount: 4,
    originalDocumentName: 'Maths_Second_Degre.pdf',
    fileSize: 1980000,
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-03T18:00:00Z',
    isDownloaded: true,
    progressPercentage: 65
  },
  {
    id: 'crs-fr-01',
    userId: 'usr-demo-001',
    subjectId: 'sbj-fr',
    subjectName: 'Français',
    title: 'Le commentaire composé',
    summary: 'Méthodologie d’analyse littéraire, formulation de problématique, élaboration de plan et citation des textes.',
    difficulty: 3,
    status: 'ready',
    conceptsCount: 3,
    originalDocumentName: 'Francais_Commentaire_Methode.pdf',
    fileSize: 2200000,
    createdAt: '2026-09-03T09:00:00Z',
    updatedAt: '2026-09-03T16:00:00Z',
    isDownloaded: false,
    progressPercentage: 40
  },
  {
    id: 'crs-sci-01',
    userId: 'usr-demo-001',
    subjectId: 'sbj-sci',
    subjectName: 'Sciences',
    title: 'La reproduction humaine',
    summary: 'Gamètes, fécondation, étapes du développement embryonnaire et transmission des caractères héréditaires.',
    difficulty: 2,
    status: 'ready',
    conceptsCount: 3,
    originalDocumentName: 'Sciences_Reproduction_Ch1.pdf',
    fileSize: 2800000,
    createdAt: '2026-09-03T08:00:00Z',
    updatedAt: '2026-09-03T14:00:00Z',
    isDownloaded: false,
    progressPercentage: 25
  },
  {
    id: 'crs-svt-01',
    userId: 'usr-demo-001',
    subjectId: 'sbj-svt',
    subjectName: 'SVT',
    title: 'La tectonique des plaques et le volcanisme',
    summary: 'Mouvements des plaques lithosphériques, zones de subduction, dorsales océaniques et aléas volcaniques.',
    difficulty: 3,
    status: 'ready',
    conceptsCount: 4,
    originalDocumentName: 'Cours_SVT_Ch3_Plaques.pdf',
    fileSize: 2450000,
    createdAt: '2026-09-01T10:15:00Z',
    updatedAt: '2026-09-02T14:30:00Z',
    isDownloaded: true,
    progressPercentage: 80
  },
  {
    id: 'crs-hist-01',
    userId: 'usr-demo-001',
    subjectId: 'sbj-hist',
    subjectName: 'Histoire-Géo',
    title: 'La Première Guerre mondiale (1914-1918)',
    summary: 'Guerre de mouvement et de position, violence de masse, vie dans les tranchées et génocide arménien.',
    difficulty: 3,
    status: 'ready',
    conceptsCount: 4,
    originalDocumentName: 'Histoire_1GM_Verdun.pdf',
    fileSize: 3120000,
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-02T11:20:00Z',
    isDownloaded: false,
    progressPercentage: 50
  },
  {
    id: 'crs-math-01',
    userId: 'usr-demo-001',
    subjectId: 'sbj-math',
    subjectName: 'Mathématiques',
    title: 'Théorème de Pythagore et sa réciproque',
    summary: 'Calculer la longueur de l’hypoténuse, prouver qu’un triangle est rectangle et applications concrètes.',
    difficulty: 2,
    status: 'ready',
    conceptsCount: 3,
    originalDocumentName: 'Maths_Pythagore_Fiche.pdf',
    fileSize: 1840000,
    createdAt: '2026-09-02T16:00:00Z',
    updatedAt: '2026-09-03T08:00:00Z',
    isDownloaded: false,
    progressPercentage: 70
  }
];

export const CONCEPTS_FIXTURES: CourseConcept[] = [
  // SVT
  {
    id: 'cpt-svt-1',
    courseId: 'crs-svt-01',
    name: 'Lithosphère et Asthénosphère',
    summary: 'La lithosphère rigide (100 km) flotte sur l’asthénosphère ductile et déformable.',
    importance: 5,
    masteryScore: 85,
    keyPoints: [
      'La lithosphère est découpée en plaques tectoniques rigides.',
      'L’asthénosphère permet le glissement lent des plaques par convection.'
    ],
    rulesFormulas: ['Épaisseur lithosphère continentale ~ 100-150 km', 'Épaisseur lithosphère océanique ~ 70-100 km'],
    isWeak: false
  },
  {
    id: 'cpt-svt-2',
    courseId: 'crs-svt-01',
    name: 'Subduction et Fosses Océaniques',
    summary: 'Plongement d’une plaque océanique dense sous une autre plaque moins dense.',
    importance: 5,
    masteryScore: 45, // Notions faibles pour tester la révision ciblée
    keyPoints: [
      'La plaque océanique refroidie devient plus dense et s’enfonce.',
      'Provoque des séismes profonds alignés sur le plan de Wadati-Benioff et un volcanisme explosif.'
    ],
    isWeak: true
  },
  {
    id: 'cpt-svt-3',
    courseId: 'crs-svt-01',
    name: 'Dorsales Océaniques & Accrétion',
    summary: 'Zone de divergence où se forme la nouvelle croûte océanique par remontée de magma mantellique.',
    importance: 4,
    masteryScore: 78,
    keyPoints: [
      'Écartement des plaques à une vitesse de 2 à 15 cm/an.',
      'Volcanisme effusif sous-marin créant des basaltes en coussins (pillow lavas).'
    ],
    isWeak: false
  },
  {
    id: 'cpt-svt-4',
    courseId: 'crs-svt-01',
    name: 'Types de Volcanisme (Effusif vs Explosif)',
    summary: 'Différence liée à la viscosité du magma et à sa teneur en silice et en gaz dissous.',
    importance: 4,
    masteryScore: 50,
    keyPoints: [
      'Effusif : lave fluide, peu de gaz, coulées calmes (ex: Hawaï).',
      'Explosif : lave visqueuse, riche en gaz, panaches de cendres et nuées ardentes (ex: Montagne Pelée).'
    ],
    isWeak: true
  },

  // Histoire
  {
    id: 'cpt-hist-1',
    courseId: 'crs-hist-01',
    name: 'Guerre de tranchées et conditions des poilus',
    summary: 'Phase d’enlisement (1915-1917) caractérisée par l’extrême violence physique et psychologique.',
    importance: 5,
    masteryScore: 90,
    keyPoints: [
      'Boue, rats, poux, gaz asphyxiants et obus d’artillerie incessants.',
      'Verdun (1916) symbole de la guerre d’usure avec plus de 700 000 victimes.'
    ],
    isWeak: false
  },
  {
    id: 'cpt-hist-2',
    courseId: 'crs-hist-01',
    name: 'Génocide des Arméniens (1915-1916)',
    summary: 'Extermination méthodique planifiée par le gouvernement Jeune-Turc de l’Empire ottoman.',
    importance: 5,
    masteryScore: 55,
    keyPoints: [
      'Déportations forcées à travers le désert de Syrie et massacres de masse.',
      'Environ 1,2 à 1,5 million de victimes civiles.'
    ],
    isWeak: true
  },

  // Maths
  {
    id: 'cpt-math-1',
    courseId: 'crs-math-01',
    name: 'Énoncé du Théorème de Pythagore',
    summary: 'Dans un triangle rectangle, le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.',
    importance: 5,
    masteryScore: 95,
    keyPoints: [
      'Valable uniquement dans un triangle rectangle.',
      'L’hypoténuse est toujours le côté le plus long opposé à l’angle droit.'
    ],
    rulesFormulas: ['BC² = AB² + AC² (si le triangle ABC est rectangle en A)'],
    isWeak: false
  },
  {
    id: 'cpt-math-2',
    courseId: 'crs-math-01',
    name: 'Réciproque du Théorème de Pythagore',
    summary: 'Propriété permettant de démontrer qu’un triangle est rectangle en comparant les carrés de ses longueurs.',
    importance: 5,
    masteryScore: 52,
    keyPoints: [
      'On calcule séparément le carré du plus grand côté.',
      'Si l’égalité est vérifiée, le triangle est rectangle.'
    ],
    rulesFormulas: ['Si BC² = AB² + AC², alors ABC est rectangle en A.'],
    isWeak: true
  },
  // Mathématiques - Les équations du second degré
  {
    id: 'cpt-math-02-1',
    courseId: 'crs-math-02',
    name: 'Forme canonique et discriminant Delta',
    summary: 'Mise sous forme canonique et expression du discriminant Delta = b² - 4ac pour déterminer le nombre de racines.',
    importance: 5,
    masteryScore: 40,
    keyPoints: [
      'Identifier a, b, c dans ax² + bx + c = 0 en respectant strictement leurs signes.',
      'Calculer Delta = b² - 4ac avec rigueur avant toute recherche de racine.',
      'Si b est négatif, (-b) devient positif et b² est toujours strictement positif.'
    ],
    rulesFormulas: ['Delta = b² - 4ac', 'Forme canonique : a(x + b/(2a))² - Delta/(4a)'],
    isWeak: true
  },
  {
    id: 'cpt-math-02-2',
    courseId: 'crs-math-02',
    name: 'Calcul des racines selon le signe de Delta',
    summary: 'Discussion du nombre de racines réelles et formules de calcul selon le signe de Delta.',
    importance: 5,
    masteryScore: 50,
    keyPoints: [
      'Si Delta > 0 : deux racines distinctes x1 = (-b - sqrt(Delta))/(2a) et x2 = (-b + sqrt(Delta))/(2a).',
      'Si Delta = 0 : une racine double x0 = -b / (2a).',
      'Si Delta < 0 : aucune solution réelle (la parabole ne coupe pas l’axe des abscisses).'
    ],
    rulesFormulas: [
      'x1 = (-b - sqrt(Delta))/(2a)',
      'x2 = (-b + sqrt(Delta))/(2a)',
      'x0 = -b / (2a)'
    ],
    isWeak: true
  },
  {
    id: 'cpt-math-02-3',
    courseId: 'crs-math-02',
    name: 'Factorisation et signe du trinôme',
    summary: 'Écriture factorisée du polynôme du second degré et interprétation graphique.',
    importance: 4,
    masteryScore: 75,
    keyPoints: [
      'Si Delta > 0 : factorisation P(x) = a(x - x1)(x - x2). Ne jamais oublier le facteur a devant.',
      'Si Delta = 0 : factorisation P(x) = a(x - x0)².',
      'Si Delta < 0 : pas de factorisation dans l’ensemble des réels.',
      'Le trinôme est du signe de a à l’extérieur des racines, et du signe de -a entre les racines.'
    ],
    rulesFormulas: ['P(x) = a(x - x1)(x - x2)', 'P(x) = a(x - x0)²'],
    isWeak: false
  }
];

export const REVISIONS_FIXTURES: Revision[] = [
  {
    id: 'rev-svt-01',
    courseId: 'crs-svt-01',
    courseTitle: 'La tectonique des plaques et le volcanisme',
    title: 'Fiche Essentielle — Tectonique des Plaques & Volcanisme',
    summary: 'Les mécanismes clés de la dynamique terrestre résumés en 3 points incontournables pour l’évaluation.',
    totalSections: 3,
    keyConcepts: [
      'Lithosphère rigide sur asthénosphère ductile',
      'Divergence aux dorsales vs Convergence en subduction',
      'Magmas fluides (effusif) vs magmas visqueux (explosif)'
    ],
    rulesFormulas: [
      'Vitesse des plaques : 2 à 15 cm/an',
      'Subduction = Plaque dense s’enfonce sous plaque moins dense'
    ],
    isDownloaded: true,
    downloadedAt: '2026-09-02T18:00:00Z',
    createdAt: '2026-09-01T10:20:00Z',
    updatedAt: '2026-09-02T14:30:00Z',
    sections: [
      {
        id: 'sec-svt-1',
        order: 1,
        title: '1. Structure et Mouvements des Plaques',
        content: 'La surface terrestre est découpée en 12 grandes plaques lithosphériques rigides d’environ 100 km d’épaisseur. Ces plaques reposent sur l’asthénosphère plus chaude et déformable. Le moteur de ce déplacement est la convection mantellique.',
        keyTakeaways: [
          'La lithosphère = croûte + partie supérieure rigide du manteau.',
          'L’asthénosphère est solide mais ductile à l’échelle des temps géologiques.'
        ],
        examples: [
          'La plaque Pacifique s’enfonce sous la plaque Eurasiatique à une vitesse de ~8 cm par an.'
        ]
      },
      {
        id: 'sec-svt-2',
        order: 2,
        title: '2. Les Frontières de Plaques : Dorsales et Subduction',
        content: 'Aux dorsales océaniques, les plaques s’écartent (divergence), permettant au magma de remonter et de créer de la croûte. À l’opposé, dans les zones de subduction (convergence), la plaque océanique ancienne, devenue très dense, s’enfonce sous une autre plaque.',
        keyTakeaways: [
          'Dorsale = création de lithosphère océanique (accrétion).',
          'Subduction = destruction/recyclage de la lithosphère océanique dans le manteau.'
        ],
        formulas: [
          'Plan de Wadati-Benioff : alignement des séismes de plus en plus profonds le long de la plaque plongeante.'
        ]
      },
      {
        id: 'sec-svt-3',
        order: 3,
        title: '3. Volcanisme Effusif vs Volcanisme Explosif',
        content: 'La nature de l’éruption dépend de la composition chimique du magma. Un magma pauvre en silice est fluide et libère facilement ses gaz (volcanisme effusif de point chaud ou dorsale). Un magma riche en silice et en eau est visqueux, piège les gaz et provoque des explosions violentes (zones de subduction).',
        keyTakeaways: [
          'Effusif = Coulées de lave fluide (basalte), peu de danger immédiat pour la population.',
          'Explosif = Nuées ardentes et panaches de cendres, danger mortel majeur.'
        ]
      }
    ]
  },
  {
    id: 'rev-hist-01',
    courseId: 'crs-hist-01',
    courseTitle: 'La Première Guerre mondiale (1914-1918)',
    title: 'Fiche Essentielle — La Première Guerre Mondiale',
    summary: 'Les repères chronologiques, la violence des tranchées et le premier génocide du XXe siècle.',
    totalSections: 2,
    keyConcepts: [
      'Guerre totale mobilisant soldats et civils',
      'Tranchées et déshumanisation',
      'Génocide arménien de 1915'
    ],
    rulesFormulas: [
      'Dates repères : Août 1914 (début) -> 1916 (Verdun) -> 11 Novembre 1918 (Armistice)'
    ],
    isDownloaded: false,
    createdAt: '2026-09-02T09:10:00Z',
    updatedAt: '2026-09-02T11:20:00Z',
    sections: [
      {
        id: 'sec-hist-1',
        order: 1,
        title: '1. Une Guerre Totale et Industrielle',
        content: 'Après l’échec de la guerre de mouvement en 1914, le conflit s’enlise dans les tranchées de la mer du Nord à la Suisse. C’est une guerre totale : toute l’économie, les usines, les femmes (« munitionnettes ») et la propagande sont mobilisées pour la victoire.',
        keyTakeaways: [
          'L’artillerie lourde cause 80% des blessures et des morts.',
          'Verdun et la Somme en 1916 atteignent un paroxysme de destruction.'
        ]
      },
      {
        id: 'sec-hist-2',
        order: 2,
        title: '2. Les Violences contre les Civils et le Génocide Arménien',
        content: 'La guerre frappe aussi massivement les civils par les bombardements, le travail forcé et les déportations. Entre 1915 et 1916, le gouvernement ottoman organise le massacre et la déportation de plus d’un million d’Arméniens.',
        keyTakeaways: [
          'Définition génocide : extermination intentionnelle et systématique d’un groupe national, ethnique ou religieux.',
          'L’armistice du 11 novembre 1918 met fin aux combats.'
        ]
      }
    ]
  },
  {
    id: 'rev-math-02',
    courseId: 'crs-math-02',
    courseTitle: 'Les équations du second degré',
    title: 'Fiche Essentielle — Les équations du second degré',
    summary: 'Méthode pas à pas pour résoudre les équations du second degré à l’aide du discriminant delta et factoriser les trinômes.',
    totalSections: 2,
    keyConcepts: [
      'Forme générale ax² + bx + c = 0',
      'Calcul du discriminant Δ = b² - 4ac',
      'Signe de Δ et nombre de solutions réelles'
    ],
    rulesFormulas: [
      'Δ = b² - 4ac',
      'Si Δ > 0 : x₁ = (-b - √Δ)/(2a) et x₂ = (-b + √Δ)/(2a)',
      'Si Δ = 0 : x₀ = -b / (2a)',
      'Si Δ < 0 : aucune solution réelle'
    ],
    isDownloaded: true,
    downloadedAt: '2026-09-03T18:00:00Z',
    createdAt: '2026-09-03T10:20:00Z',
    updatedAt: '2026-09-03T18:00:00Z',
    sections: [
      {
        id: 'sec-m2-1',
        order: 1,
        title: '1. Notions Fondamentales',
        content: 'Une équation du second degré s’écrit sous la forme ax² + bx + c = 0 avec a ≠ 0. Le discriminant Δ permet de déterminer immédiatement le nombre de racines réelles.',
        keyTakeaways: [
          'Identifier les coefficients a, b et c avec leurs signes respectifs.',
          'Calculer rigoureusement Δ = b² - 4ac avant de chercher les solutions.'
        ],
        formulas: ['Δ = b² - 4ac'],
        examples: ['Pour 2x² - 4x - 6 = 0 : a = 2, b = -4, c = -6 -> Δ = 16 - 4(2)(-6) = 64 > 0']
      },
      {
        id: 'sec-m2-2',
        order: 2,
        title: '2. Méthodologie & Pièges Fréquents',
        content: 'Attention aux erreurs de signe lors du calcul de (-b) et de b². Si b est négatif, (-b) devient positif et b² est toujours positif.',
        keyTakeaways: [
          'Toujours vérifier si le trinôme peut être simplifié en divisant par un facteur commun.',
          'Remplacer les solutions trouvées dans l’équation initiale pour valider le résultat.'
        ]
      }
    ]
  },
  {
    id: 'rev-fr-01',
    courseId: 'crs-fr-01',
    courseTitle: 'Le commentaire composé',
    title: 'Fiche Essentielle — Le commentaire composé',
    summary: 'La méthode structurée pour réussir le commentaire de texte littéraire : lecture attentive, repérage stylistique et plan en 2 ou 3 axes.',
    totalSections: 2,
    keyConcepts: [
      'Lecture active et repérage des procédés',
      'Construction de la problématique',
      'Plan en 2 ou 3 axes avec sous-parties étayées'
    ],
    rulesFormulas: [
      'Structure : Idée directrice -> Citation du texte -> Procédé d’écriture -> Effet produit'
    ],
    isDownloaded: false,
    createdAt: '2026-09-03T09:10:00Z',
    updatedAt: '2026-09-03T16:00:00Z',
    sections: [
      {
        id: 'sec-fr-1',
        order: 1,
        title: '1. Méthode d’Analyse et Problématique',
        content: 'L’analyse littéraire ne consiste pas à raconter l’histoire, mais à expliquer comment le texte produit son sens grâce aux figures de style, à la syntaxe et aux tonalités.',
        keyTakeaways: [
          'Ne jamais paraphraser le texte.',
          'Toujours relier un procédé stylistique à son sens et à l’émotion transmise.'
        ]
      },
      {
        id: 'sec-fr-2',
        order: 2,
        title: '2. Organisation du Développement',
        content: 'Chaque axe répond à la problématique. Chaque sous-partie s’articule autour d’un argument précis appuyé par une citation courte entre guillemets.',
        keyTakeaways: [
          'Introduire chaque paragraphe par une phrase d’annonce claire.',
          'Assurer des transitions fluides entre chaque grande partie.'
        ]
      }
    ]
  },
  {
    id: 'rev-sci-01',
    courseId: 'crs-sci-01',
    courseTitle: 'La reproduction humaine',
    title: 'Fiche Essentielle — La reproduction humaine',
    summary: 'Les mécanismes fondamentaux de la procréation : cellules reproductrices, fécondation, nidation et régulation hormonale.',
    totalSections: 2,
    keyConcepts: [
      'Gamètes mâles (spermatozoïdes) et femelles (ovocytes)',
      'Fécondation dans le tiers supérieur de la trompe',
      'Cycles ovarien et utérin régulés par les hormones'
    ],
    rulesFormulas: [
      'Fécondation = Rencontre et fusion des noyaux du spermatozoïde et de l’ovocyte -> Cellule-œuf (zygote)'
    ],
    isDownloaded: false,
    createdAt: '2026-09-03T08:15:00Z',
    updatedAt: '2026-09-03T14:00:00Z',
    sections: [
      {
        id: 'sec-sci-1',
        order: 1,
        title: '1. De la Rencontre des Gamètes à la Nidation',
        content: 'Lors d’un rapport sexuel en période de fertilité, les spermatozoïdes remontent l’utérus jusqu’à la trompe. Un seul pénètre l’ovocyte. La cellule-œuf issue de la fécondation se divise tout en migrant vers l’utérus où elle s’implante.',
        keyTakeaways: [
          'La fécondation a lieu dans la trompe de Fallope.',
          'La nidation a lieu dans la muqueuse utérine (endomètre) environ 6 jours après la fécondation.'
        ]
      }
    ]
  },
  {
    id: 'rev-math-01',
    courseId: 'crs-math-01',
    courseTitle: 'Théorème de Pythagore et sa réciproque',
    title: 'Fiche Essentielle — Théorème de Pythagore & Réciproque',
    summary: 'Comprendre et appliquer le théorème de Pythagore pour calculer une longueur et la réciproque pour prouver qu’un triangle est rectangle.',
    totalSections: 2,
    keyConcepts: [
      'Triangle rectangle et hypoténuse',
      'Égalité de Pythagore : BC² = AB² + AC²',
      'Réciproque pour tester l’angle droit'
    ],
    rulesFormulas: [
      'Dans ABC rectangle en A : BC² = AB² + AC²',
      'Pour prouver qu’un triangle est rectangle : calculer séparément BC² et AB² + AC²'
    ],
    isDownloaded: false,
    createdAt: '2026-09-02T16:10:00Z',
    updatedAt: '2026-09-03T08:00:00Z',
    sections: [
      {
        id: 'sec-m1-1',
        order: 1,
        title: '1. Calculer la Longueur de l’Hypoténuse',
        content: 'Dans un triangle rectangle, le carré de l’hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés.',
        keyTakeaways: [
          'Toujours commencer par préciser : "Dans le triangle ABC rectangle en A, d’après le théorème de Pythagore...".',
          'Prendre la racine carrée positive pour trouver la longueur finale.'
        ],
        formulas: ['BC = √(AB² + AC²)']
      }
    ]
  }
];

export const QUIZZES_FIXTURES: Quiz[] = [
  {
    id: 'qiz-math-02',
    courseId: 'crs-math-02',
    courseTitle: 'Les équations du second degré',
    title: 'Quiz d’Évaluation — Équations du second degré',
    totalQuestions: 4,
    difficulty: 2,
    status: 'available',
    bestScore: 40,
    lastPlayedAt: '2026-09-03T10:00:00Z',
    questions: [
      {
        id: 'qst-math-02-1',
        quizId: 'qiz-math-02',
        courseId: 'crs-math-02',
        conceptId: 'cpt-math-02-1',
        conceptName: 'Forme canonique et discriminant Delta',
        question: 'Pour l’équation 2x² - 4x - 6 = 0, quelle est la valeur exacte du discriminant Delta ?',
        choices: [
          'Delta = 64',
          'Delta = -32',
          'Delta = 16',
          'Delta = 32'
        ],
        correctChoiceIndex: 0,
        explanation: 'Delta = b² - 4ac = (-4)² - 4*(2)*(-6) = 16 - (-48) = 16 + 48 = 64. Attention aux signes lors du produit de deux facteurs négatifs !',
        difficulty: 2
      },
      {
        id: 'qst-math-02-2',
        quizId: 'qiz-math-02',
        courseId: 'crs-math-02',
        conceptId: 'cpt-math-02-2',
        conceptName: 'Calcul des racines selon le signe de Delta',
        question: 'Combien de solutions réelles admet une équation du second degré lorsque Delta est strictement négatif (Delta < 0) ?',
        choices: [
          'Deux solutions distinctes',
          'Une unique solution double',
          'Aucune solution réelle',
          'Une infinité de solutions'
        ],
        correctChoiceIndex: 2,
        explanation: 'Dans l’ensemble des réels R, la racine carrée d’un nombre strictement négatif n’existe pas. L’équation n’a donc aucune solution réelle et la parabole ne coupe jamais l’axe des abscisses.',
        difficulty: 1
      },
      {
        id: 'qst-math-02-3',
        quizId: 'qiz-math-02',
        courseId: 'crs-math-02',
        conceptId: 'cpt-math-02-2',
        conceptName: 'Calcul des racines selon le signe de Delta',
        question: 'Pour l’équation x² - 6x + 9 = 0, le discriminant vaut Delta = 0. Quelle est la solution double x0 ?',
        choices: [
          'x0 = 3',
          'x0 = -3',
          'x0 = 6',
          'x0 = 0'
        ],
        correctChoiceIndex: 0,
        explanation: 'Lorsque Delta = 0, la racine double est x0 = -b / (2a) = -(-6) / (2*1) = 6 / 2 = 3. On remarque d’ailleurs l’identité remarquable (x - 3)² = 0.',
        difficulty: 2
      },
      {
        id: 'qst-math-02-4',
        quizId: 'qiz-math-02',
        courseId: 'crs-math-02',
        conceptId: 'cpt-math-02-3',
        conceptName: 'Factorisation et signe du trinôme',
        question: 'Si une équation du second degré admet pour racines x1 = 1 et x2 = 5 avec a = 3, quelle est sa forme factorisée ?',
        choices: [
          '3(x - 1)(x - 5)',
          '(x - 1)(x - 5)',
          '3(x + 1)(x + 5)',
          '(3x - 1)(x - 5)'
        ],
        correctChoiceIndex: 0,
        explanation: 'La factorisation générale d’un trinôme admettant deux racines réelles est P(x) = a(x - x1)(x - x2). N’oublie jamais de reporter le coefficient a en facteur.',
        difficulty: 2
      }
    ]
  },
  {
    id: 'qiz-svt-01',
    courseId: 'crs-svt-01',
    courseTitle: 'La tectonique des plaques et le volcanisme',
    title: 'Quiz de Maîtrise — Tectonique & Volcans',
    totalQuestions: 4,
    difficulty: 2,
    status: 'available',
    bestScore: 75,
    lastPlayedAt: '2026-09-02T15:00:00Z',
    questions: [
      {
        id: 'qst-svt-1',
        quizId: 'qiz-svt-01',
        courseId: 'crs-svt-01',
        conceptId: 'cpt-svt-1',
        conceptName: 'Lithosphère et Asthénosphère',
        question: 'Sur quelle couche géologique les plaques lithosphériques rigides reposent-elles et se déplacent-elles ?',
        choices: [
          'Le noyau externe liquide',
          'L’asthénosphère ductile et déformable',
          'La croûte continentale granitique',
          'Le manteau inférieur rigide'
        ],
        correctChoiceIndex: 1,
        explanation: 'La lithosphère rigide repose directement sur l’asthénosphère, une couche du manteau supérieur qui est solide mais ductile à haute température, ce qui permet la convection.',
        difficulty: 1
      },
      {
        id: 'qst-svt-2',
        quizId: 'qiz-svt-01',
        courseId: 'crs-svt-01',
        conceptId: 'cpt-svt-2',
        conceptName: 'Subduction et Fosses Océaniques',
        question: 'Quelle est la cause principale de l’enfoncement d’une plaque océanique dans une zone de subduction ?',
        choices: [
          'L’attraction magnétique terrestre',
          'L’augmentation de sa densité en refroidissant au cours du temps',
          'La pression de l’eau des océans',
          'L’érosion causée par les courants marins'
        ],
        correctChoiceIndex: 1,
        explanation: 'En s’éloignant de la dorsale, la lithosphère océanique refroidit et s’épaissit. Sa densité devient supérieure à celle de l’asthénosphère sous-jacente, provoquant son plongement naturel.',
        difficulty: 2
      },
      {
        id: 'qst-svt-3',
        quizId: 'qiz-svt-01',
        courseId: 'crs-svt-01',
        conceptId: 'cpt-svt-3',
        conceptName: 'Dorsales Océaniques & Accrétion',
        question: 'Quel phénomène géologique se déroule au niveau d’une dorsale océanique ?',
        choices: [
          'Le chevauchement de deux continents',
          'La disparition de la croûte terrestre dans le noyau',
          'L’écartement des plaques et la formation de nouvelle croûte océanique',
          'La formation exclusive de fosses abyssales de subduction'
        ],
        correctChoiceIndex: 2,
        explanation: 'La dorsale est une zone de divergence : les plaques s’écartent et le magma mantellique remonte, créant en se solidifiant de la nouvelle croûte océanique.',
        difficulty: 1
      },
      {
        id: 'qst-svt-4',
        quizId: 'qiz-svt-01',
        courseId: 'crs-svt-01',
        conceptId: 'cpt-svt-4',
        conceptName: 'Types de Volcanisme (Effusif vs Explosif)',
        question: 'Pourquoi le volcanisme des zones de subduction est-il particulièrement explosif ?',
        choices: [
          'Parce que le magma est très fluide et s’écoule rapidement',
          'Parce que le magma est visqueux, riche en silice et en gaz piégés sous pression',
          'Parce qu’il n’y a aucun gaz présent dans le magma',
          'Parce que les volcans sont tous situés sous l’eau'
        ],
        correctChoiceIndex: 1,
        explanation: 'Dans les zones de subduction, l’eau injectée dans le manteau produit un magma riche en silice et très visqueux. Les gaz ont du mal à s’échapper, la pression monte jusqu’à l’explosion.',
        difficulty: 2
      }
    ]
  },
  {
    id: 'qiz-hist-01',
    courseId: 'crs-hist-01',
    courseTitle: 'La Première Guerre mondiale (1914-1918)',
    title: 'Quiz Repères — 1ère Guerre Mondiale',
    totalQuestions: 2,
    difficulty: 2,
    status: 'available',
    questions: [
      {
        id: 'qst-hist-1',
        quizId: 'qiz-hist-01',
        courseId: 'crs-hist-01',
        conceptId: 'cpt-hist-1',
        conceptName: 'Guerre de tranchées et conditions des poilus',
        question: 'Quelle bataille de 1916 est devenue le symbole de la guerre d’usure et de la violence de masse en France ?',
        choices: [
          'La bataille d’Austerlitz',
          'La bataille de Verdun',
          'La bataille de Marignan',
          'La bataille de Waterloo'
        ],
        correctChoiceIndex: 1,
        explanation: 'La bataille de Verdun (février - décembre 1916) a opposé Français et Allemands dans un enfer d’artillerie causant plus de 700 000 victimes sans avancée stratégique majeure.',
        difficulty: 1
      },
      {
        id: 'qst-hist-2',
        quizId: 'qiz-hist-01',
        courseId: 'crs-hist-01',
        conceptId: 'cpt-hist-2',
        conceptName: 'Génocide des Arméniens (1915-1916)',
        question: 'En quelle année a débuté le génocide des Arméniens dans l’Empire ottoman ?',
        choices: ['1914', '1915', '1917', '1918'],
        correctChoiceIndex: 1,
        explanation: 'Le génocide débute le 24 avril 1915 à Constantinople avec l’arrestation des intellectuels arméniens, suivie de déportations massives et de massacres systématiques.',
        difficulty: 2
      }
    ]
  },
  {
    id: 'qiz-math-01',
    courseId: 'crs-math-01',
    courseTitle: 'Théorème de Pythagore et sa réciproque',
    title: 'Quiz d’Application — Théorème de Pythagore',
    totalQuestions: 2,
    difficulty: 2,
    status: 'available',
    bestScore: 70,
    lastPlayedAt: '2026-09-02T18:00:00Z',
    questions: [
      {
        id: 'qst-math-1',
        quizId: 'qiz-math-01',
        courseId: 'crs-math-01',
        conceptId: 'cpt-math-1',
        conceptName: 'Énoncé du Théorème de Pythagore',
        question: 'Dans un triangle ABC rectangle en A avec AB = 3 cm et AC = 4 cm, quelle est la longueur de l’hypoténuse BC ?',
        choices: ['5 cm', '7 cm', '6 cm', '25 cm'],
        correctChoiceIndex: 0,
        explanation: 'D’après le théorème de Pythagore : BC² = AB² + AC² = 3² + 4² = 9 + 16 = 25. Donc BC = sqrt(25) = 5 cm.',
        difficulty: 1
      },
      {
        id: 'qst-math-2',
        quizId: 'qiz-math-01',
        courseId: 'crs-math-01',
        conceptId: 'cpt-math-2',
        conceptName: 'Réciproque du Théorème de Pythagore',
        question: 'Un triangle dont les côtés mesurent 6 cm, 8 cm et 10 cm est-il rectangle ?',
        choices: [
          'Oui, car 10² = 6² + 8² (100 = 36 + 64)',
          'Non, car 6 + 8 n’est pas égal à 10',
          'Impossible à déterminer sans rapporteur',
          'Non, car 10² = 100 et 6*8 = 48'
        ],
        correctChoiceIndex: 0,
        explanation: 'Le plus grand côté est 10. 10² = 100. La somme des carrés des deux autres est 6² + 8² = 36 + 64 = 100. L’égalité étant vérifiée, le triangle est rectangle.',
        difficulty: 2
      }
    ]
  }
];

export const NOTIFICATIONS_FIXTURES: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Une notion mérite d’être revue',
    message: 'Améliore ta maîtrise de « Calcul des racines selon le signe de Delta ».',
    type: 'revision',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // Il y a 2h
    relativeTime: 'Il y a 2h',
    targetTab: 'revisions',
    targetId: 'crs-math-02'
  },
  {
    id: 'notif-2',
    title: 'Ton rappel de révision est prêt',
    message: 'Poursuis ta révision sur « Le commentaire composé » en Français.',
    type: 'reminder',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // Il y a 5h
    relativeTime: 'Il y a 5h',
    targetTab: 'revisions',
    targetId: 'crs-fr-01'
  },
  {
    id: 'notif-3',
    title: 'Tu viens de gagner de l’XP ! ⚡',
    message: 'Bravo, +50 XP remportés lors de ta dernière séance de travail.',
    type: 'progress',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), // Hier
    relativeTime: 'Hier',
    targetTab: 'profile'
  },
  {
    id: 'notif-4',
    title: 'Ton quiz est prêt 🎯',
    message: 'Vérifie ta mémorisation sur les équations du second degré.',
    type: 'quiz',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(), // Il y a 2 jours
    relativeTime: 'Il y a 2j',
    targetTab: 'quizzes',
    targetId: 'crs-math-02'
  },
  {
    id: 'notif-5',
    title: 'Tu as gagné des diamants 💎',
    message: '+5 diamants ajoutés à ton solde pour ta régularité exemplaire.',
    type: 'reward',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(), // Il y a 3 jours
    relativeTime: 'Il y a 3j',
    targetTab: 'profile'
  }
];
