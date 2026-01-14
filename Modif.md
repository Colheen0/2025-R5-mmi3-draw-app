Résumé des Fonctionnalités Ajoutées
1. Ajout de la Couleur
Modification : j'ai créer une variable strokeColor en string que j'ai mis à la place de la couleur noir dans mon fichier drawArea (et j'ai régler la couleur de base sur noir) puis j'ai créer dans mon fichier toolbar un input color (pour rendre la sélection plus large et plus simple) avec l'id colorPicker qui prends une couleur et l'envoie dans la variable strokeColor.

2. Ajout de l'épaisseur du trait 
Modification : Sur le meme principe que le colorPicker j'ai créer une variable strokeWidth que j'ai placer à la place de la taille de base dans le fichier drawArea (et j'ai mis la valeur de base sur 3) puis dans mon fichier toolbar j'ai créer un input range qui va de 1 à 50 avec l'id WidthPicker.

3. Bouton "Tout Effacer" (Synchronisé)
Modification : De base j'avais créer une gomme qui était simplement la couleur blanche pour le crayon et comme j'ai rajouter colorPicker entre temps la couleur blanche est déjà disponible donc j'ai décider de créer un bouton pour tout éffacer (même les traits des autres pour gagner du temps). Donc j'ai ajouter dans le fichier le socketmanager un type draw:clear, puis dans le fichier server.ts j'ai appeler la fonction ClearAllStroke qui existait déjà dans fichier draw.ts et dans cet appel j'envoie un avertissment à l'utilisateur qu'il doit valider pour que tout s'efface. en résumer : 
Le client envoie un signal draw:clear.
Le serveur vide sa mémoire (l'historique des traits).

4. Ajout de la pastille de couleur 
Modification : J'ai ajouter dans les props du type user le color en string puis j'ai modifier le badge et la liste des utilisateur pour mettre la pastille ensuite j'ai ajouter dans le drawPage une fonction handleColorChange qui relie la couleur de pinceau à la couleur de la pastille 