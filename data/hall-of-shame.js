window.HALL_OF_SHAME = {

  // Rempli automatiquement par l'addon (Phase 6) via SavedVariables → Uploader → API
  // En attendant, ajouter manuellement les entrées ici

  deaths: [
    // Structure :
    // {
    //   id: 1,
    //   player: "Alban",           // nom exact du joueur
    //   cause: "Defile",           // sort / mécanisme qui a tué
    //   causeId: 72754,            // spell ID WoW (pour le lien Wowhead, optionnel)
    //   instance: "ICC",           // instance courte
    //   boss: "The Lich King",     // boss en cours
    //   description: "A marché dans son propre Defile. Deux fois.",
    //   date: null,                // "2026-07-XX"
    //   wipe: true                 // le groupe a wipe à cause de lui ?
    // }
  ],

  screenshots: [
    // Structure :
    // {
    //   id: 1,
    //   title: "Premier kill Kel'Thuzad",
    //   player: null,              // null = groupe entier
    //   description: "On y croyait plus.",
    //   date: null,                // "2026-07-XX"
    //   url: null,                 // "assets/screenshots/ktz.jpg"
    //   type: "kill"               // "kill" | "fail" | "moment"
    // }
  ]

};
