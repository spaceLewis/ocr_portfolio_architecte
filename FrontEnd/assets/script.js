const worksApiUrl = "http://localhost:5678/api/works";
const categoriesApiUrl = "http://localhost:5678/api/categories";
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
 * Supprime un projet via l'API (token admin stocké au login) puis retire ses éléments de la page.
 */
async function deleteWork(workId) {
	try {
		const response = await fetch(`${worksApiUrl}/${workId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
		});

		if (!response.ok) {
			throw new Error(`La suppression a échoué (${response.status}).`);
		}

		log(`Projet ${workId} supprimé.`);
		// Retire le projet de la galerie principale et de la modale
		document
			.querySelectorAll(`[data-work-id="${workId}"]`)
			.forEach((element) => element.remove()); // Supprime tous les éléments correspondant au projet supprimé
	} catch (error) {
		console.error("Impossible de supprimer le projet.", error);
		alert("Le projet n'a pas pu être supprimé.");
	}
}

/**
 * Crée un élément HTML représentant un projet.
 */
function createWorkElement(work, isModal = false) {
	const figure = document.createElement("figure");
	const image = document.createElement("img");

	figure.dataset.workId = work.id;

	log(`Création de l'élément pour le projet ${work.id}`);

	image.src = work.imageUrl;
	image.alt = work.title;
	figure.appendChild(image);

	if (isModal) {
		// Dans la modale : bouton de suppression au lieu de la légende
		const deleteButton = document.createElement("button");
		const deleteIcon = document.createElement("img");

		deleteButton.type = "button";
		deleteButton.className = "delete-work-button";
		deleteIcon.src = "./assets/icons/delete.png";
		deleteIcon.alt = "Supprimer";
		deleteButton.addEventListener("click", () => deleteWork(work.id));
		deleteButton.appendChild(deleteIcon);
		figure.appendChild(deleteButton);
	} else {
		const caption = document.createElement("figcaption");
		caption.innerText = work.title;
		figure.appendChild(caption);
	}

	return figure;
}

/**
 * Affiche la liste des projets dans la galerie.
 */
function displayWorks(gallery, works, isModal = false) {
	gallery.innerText = "";

    /* Ajoute chaque projet dans la galerie en créant et en ajoutant l'élément HTML associé */
	works.forEach((work) => {
		gallery.appendChild(createWorkElement(work, isModal));
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

		if (isAdmin) {
			initModal(works);
		}
	} catch (error) {
		console.error("Impossible de charger les projets.", error);
		displayWorksLoadingError(gallery);
	}
}

/**
 * Initialise la modale d'édition des projets (ouverture, fermeture, affichage des projets).
 */
function initModal(works) {
	const modal = document.getElementById("edit-modal");
	const modalGallery = modal.querySelector(".modal-gallery");

	displayWorks(modalGallery, works, true);

	// Listener pour ouvrir la modale lorsqu'on clique sur le bouton "Modifier les projets"
	document.getElementById("edit-projects-button").addEventListener("click", () => {
		modal.hidden = false;
	});

	// Listener pour fermer la modale lorsqu'on clique sur le bouton de fermeture
	document.getElementById("close-modal-button").addEventListener("click", () => {
		modal.hidden = true;
		showGalleryView();
	});

	// Listener pour fermer la modale lorsqu'on clique en dehors de la modale (sur le fond)
	modal.addEventListener("click", (event) => {
		if (event.target === modal) {
			modal.hidden = true;
			showGalleryView();
		}
	});

	initAddWorkForm(modalGallery);
}

// Affiche la vue galerie et masque la vue ajout photo.
function showGalleryView() {
	document.getElementById("gallery-view").hidden = false;
	document.getElementById("add-view").hidden = true;
}

// Affiche la vue ajout photo et masque la vue galerie.
function showAddView() {
	document.getElementById("gallery-view").hidden = true;
	document.getElementById("add-view").hidden = false;
}

/**
 * Récupère les catégories depuis l'API et remplit le select du formulaire.
 */
async function loadCategoryOptions(select) {
	try {
		const response = await fetch(categoriesApiUrl);
		const categories = await response.json();

		categories.forEach((category) => {
			const option = document.createElement("option");
			option.value = category.id;
			option.innerText = category.name;
			select.appendChild(option);
		});
		select.value = ""; // Aucune catégorie sélectionnée par défaut
	} catch (error) {
		console.error("Impossible de charger les catégories.", error);
	}
}

/**
 * Initialise la vue "Ajout photo" : navigation, aperçu, validation et envoi à l'API.
 */
function initAddWorkForm(modalGallery) {
	const form = document.getElementById("add-work-form");
	const imageInput = document.getElementById("work-image");
	const titleInput = document.getElementById("work-title");
	const categorySelect = document.getElementById("work-category");
	const preview = document.getElementById("image-preview");
	const imageUpload = document.querySelector(".image-upload");
	const error = document.getElementById("form-error");
	const validateButton = document.getElementById("validate-button");

	loadCategoryOptions(categorySelect);

	// Active le bouton Valider uniquement quand l'image, le titre et la catégorie sont renseignés
	function updateValidateButton() {
		validateButton.disabled = !(imageInput.files[0] && titleInput.value.trim() && categorySelect.value);
	}
	form.addEventListener("input", updateValidateButton);
	form.addEventListener("change", updateValidateButton);

	// Réinitialise le formulaire lorsqu'on ouvre la vue ajout photo
	function resetForm() {
		form.reset();
		preview.hidden = true;
		imageUpload.classList.remove("has-image");
		error.hidden = true;
		updateValidateButton();
	}

	// Affiche un message d'erreur dans le formulaire
	function showError(message) { 
		error.innerText = message;
		error.hidden = false;
	}

	// Listener pour ouvrir la vue ajout photo
	document.getElementById("add-photo-button").addEventListener("click", showAddView);

	// Listener pour revenir à la vue galerie depuis la vue ajout photo
	document.getElementById("back-button").addEventListener("click", () => {
		resetForm();
		showGalleryView();
	});

	// Vide le formulaire lorsqu'on ferme la modale
	document.getElementById("close-modal-button").addEventListener("click", resetForm);

	// Aperçu de l'image choisie
	imageInput.addEventListener("change", () => {
		const file = imageInput.files[0];
		if (file) {
			preview.src = URL.createObjectURL(file); // Affiche l'aperçu de l'image sélectionnée
			preview.hidden = false;
			imageUpload.classList.add("has-image"); // Masque le bouton et le texte d'aide
		}
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault(); // Empêche le rechargement par défaut de la page lors de l'envoi du formulaire
		const file = imageInput.files[0];

		// Vérifie que tous les champs sont remplis
		if (!file || !titleInput.value.trim() || !categorySelect.value) { 
			showError("Veuillez choisir une image, un titre et une catégorie.");
			return;
		}
		// Vérifie que la taille de l'image ne dépasse pas 4 Mo
		if (file.size > 4 * 1024 * 1024) { // 4 Mo en octets
			showError("L'image ne doit pas dépasser 4 Mo.");
			return;
		}

		const formData = new FormData(); // Crée un nouvel objet FormData pour envoyer les données du formulaire
		formData.append("image", file); // Ajoute l'image au FormData
		formData.append("title", titleInput.value.trim()); // Ajoute le titre au FormData
		formData.append("category", categorySelect.value); // Ajoute la catégorie au FormData

		try {
			const response = await fetch(worksApiUrl, {
				method: "POST",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`L'ajout a échoué (${response.status}).`);
			}

			const work = await response.json();
			// L'API renvoie le projet créé : on l'ajoute à la galerie et à la modale
			document.querySelector(".gallery").appendChild(createWorkElement(work)); // Ajoute le projet à la galerie principale
			modalGallery.appendChild(createWorkElement(work, true)); // Ajoute le projet à la modale de la galerie

			resetForm(); // Réinitialise le formulaire après l'ajout du projet
			showGalleryView(); // Affiche la vue de la galerie après l'ajout du projet
		} catch (err) {
			console.error("Impossible d'ajouter le projet.", err);
			showError("Le projet n'a pas pu être ajouté.");
		}
	});
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