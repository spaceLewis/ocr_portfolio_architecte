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
 * Initialise la galerie des projets en récupérant les données depuis l'API puis en les affichant.
 * Affiche un message d'erreur si le chargement échoue.
 */
async function initGallery() {
	const gallery = document.querySelector(".gallery");

	if (!gallery) {
		console.error("La galerie des projets est introuvable.");
		return;
	}

	try {
		const works = await getWorks();
		displayWorks(gallery, works);
	} catch (error) {
		console.error("Impossible de charger les projets.", error);
		displayWorksLoadingError(gallery);
	}
}

initGallery();