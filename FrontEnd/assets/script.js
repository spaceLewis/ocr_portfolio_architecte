const worksApiUrl = "http://localhost:5678/api/works";
const debug = true;

/**
 * Affiche les messages de debug dans la console si debug est activé.
 */
function log(messages) {
	if (debug) {
		console.log(messages);
	}
}

/**
 * Récupère la liste des projets depuis l'API.
 */
async function getWorks() {
	log("Chargement des projets depuis l'API.");

	const response = await fetch(worksApiUrl);

	if (!response.ok) {
		throw new Error(`La récupération des projets a échoué (${response.status}).`);
	}

	const works = await response.json();

	log(`${works.length} projets récupérés.`);
    log(works);
    
	return works;
}

/**
 * Crée un élément HTML représentant un projet.
 */
function createWorkElement(work) {
	const figure = document.createElement("figure");
	const image = document.createElement("img");
	const caption = document.createElement("figcaption");

	image.src = work.imageUrl;
	image.alt = work.title;
	caption.innerText = work.title;

	figure.appendChild(image);
	figure.appendChild(caption);

	return figure;
}

/**
 * Affiche la liste des projets dans la galerie.
 */
function displayWorks(gallery, works) {
	gallery.innerText = "";

    /* Ajoute chaque projet dans la galerie en créant et en ajoutant l'élément HTML associé */
	works.forEach((work) => {
		gallery.appendChild(createWorkElement(work));
	});

	log("Les projets ont été ajoutés à la galerie.");
}

/**
 * Affiche un message d'erreur dans la galerie lorsque le chargement des projets échoue.
 */
function displayWorksLoadingError(gallery) {
	const message = document.createElement("p");

	message.innerText = "Les projets ne peuvent pas être chargés pour le moment.";
    message.style.color = "red";
	gallery.appendChild(message);
}

/**
 * Extrait les catégories uniques des projets
 */
function getCategories(works) {
	const uniqueCategoryIds = new Set(); // Set des id uniques des catégories
	const categories = []; // liste des catégories trouvées

	// Parcourt chaque projet et ajoute sa catégorie si non présente à la liste des catégories uniques.
	works.forEach((work) => {
		if (!uniqueCategoryIds.has(work.category.id)) {
			uniqueCategoryIds.add(work.category.id);
			categories.push(work.category);
		}
	});

	log(`${uniqueCategoryIds.size} catégories uniques trouvées.`);
	log(uniqueCategoryIds);

	log(`${categories.length} catégories trouvées.`);
	log(categories);

	return categories;
}

/**
 * Crée un bouton de filtre.
 */
function createFilterButton(label, onClick) {
	const button = document.createElement("button");

	button.type = "button";
	button.innerText = label;
	button.addEventListener("click", onClick);

	return button;
}

/**
 * Génère le menu de filtres (bouton "Tous" + une catégorie par bouton)
 * et filtre la galerie au clic.
 */
function displayFilters(filtersContainer, gallery, works) {
	const buttons = [];

	/**
	 * Sélectionne un filtre et met à jour la galerie en fonction de la catégorie sélectionnée
	 * button : Le bouton de filtre sélectionné
	 * categoryId : L'ID de la catégorie à filtrer ou null pour "Tous"
	 */
	function selectFilter(button, categoryId) {
		buttons.forEach((item) => item.classList.remove("active")); // Supprime la classe "active" de tous les boutons avant d'ajouter celle du bouton sélectionné.
		button.classList.add("active"); // Ajoute la classe "active" au bouton sélectionné.

		// Filtre les projets en fonction de la catégorie sélectionnée : 
		// si "Tous" est sélectionné, on affiche tous les projets sinon on filtre les projets correspondant à la catégorie sélectionnée.
		const filteredWorks =
			categoryId === null
				? works
				: works.filter((work) => work.categoryId === categoryId);

		log(`Filtre sélectionné : ${button.innerText} (${filteredWorks.length} projets).`);
		displayWorks(gallery, filteredWorks);
	}

	const allButton = createFilterButton("Tous", () => selectFilter(allButton, null));
	buttons.push(allButton); // Ajoute le bouton "Tous" à la liste des boutons de filtre.
	allButton.classList.add("active"); // Bouton "Tous" actif par défaut. 

	// Crée un bouton pour chaque catégorie et l'ajoute à la liste des boutons de filtre.
	getCategories(works).forEach((category) => {
		const button = createFilterButton(category.name, () =>
			selectFilter(button, category.id),
		);
		buttons.push(button);
	});

	// Ajoute tous les boutons de filtre au conteneur des filtres.
	buttons.forEach((button) => filtersContainer.appendChild(button));
}

/**
 * Initialise la galerie des projets en récupérant les données depuis l'API puis en les affichant.
 * Affiche un message d'erreur si le chargement échoue.
 */
async function initGallery(isAdmin) {
	const gallery = document.querySelector(".gallery");
	const filtersContainer = document.querySelector(".filters");

	if (!gallery || !filtersContainer) {
		console.error("La galerie ou le menu de filtres est introuvable.");
		return;
	}

	filtersContainer.style.display = isAdmin ? "none" : "";

	try {
		const works = await getWorks();

		if (!isAdmin) {
			displayFilters(filtersContainer, gallery, works);
		}

		displayWorks(gallery, works);
	} catch (error) {
		console.error("Impossible de charger les projets.", error);
		displayWorksLoadingError(gallery);
	}
}

/**
 * Affiche les contrôles réservés à l'administrateur connecté.
 */
function initAdminControls(isAdmin) {
	const authenticationLink = document.getElementById("authentication-link");
	const editProjectsButton = document.getElementById("edit-projects-button");

	if (isAdmin) {
		editProjectsButton.hidden = false;

		authenticationLink.innerText = "logout";
		authenticationLink.href = "./index.html";
		// Listener pour gérer la déconnexion lorsqu'un utilisateur clique sur logout
		authenticationLink.addEventListener("click", (event) => {
			event.preventDefault();
			localStorage.removeItem("token");
			window.location.href = "./index.html";
		});
		
	}else{
		// Si pas admin, on ne fait rien pour laisser le lien d'authentification
		return;
	}

}


// Vérifie si l'utilisateur est loggué en admin
let isAdmin = false; 
if (localStorage.getItem("token")) {
	isAdmin = true;
}

initAdminControls(isAdmin);
initGallery(isAdmin);