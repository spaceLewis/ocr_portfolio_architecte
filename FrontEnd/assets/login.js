const loginApiUrl = "http://localhost:5678/api/users/login";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

// Affiche le message d'erreur de connexion
function displayLoginError(message) {
	loginError.innerText = message;
	loginError.hidden = false;
}

// Cache le message d'erreur de connexion
function hideLoginError() {
	loginError.innerText = "";
	loginError.hidden = true;
}

// Gère la soumission du formulaire de connexion
async function login(event) { // event : objet représentant l'événement de soumission du formulaire
	event.preventDefault(); // Empêche le mode par défaut et permet de gérer la connexion via JavaScript
	hideLoginError();

	const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value;

	try {

        // Envoie la requête de connexion à l'API avec les identifiants fournis
		const response = await fetch(loginApiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

        // Vérifie si l'utilisateur a fourni des identifiants incorrects
		if (response.status === 401 || response.status === 404) { // 401: Unauthorized, 404: Not Found
			displayLoginError("Erreur dans l’identifiant ou le mot de passe");
			return;
		}

        // Vérifie si la réponse est correcte
		if (!response.ok) {
			throw new Error(`La connexion a échoué (${response.status}).`); // Gère les autres erreurs de connexion
		}

		const data = await response.json();

        // Vérifie si la réponse contient un jeton de connexion
		if (typeof data.token !== "string" || !data.token) {
			throw new Error("La réponse de connexion ne contient pas de jeton.");
		}

        // Stocke le jeton de connexion dans le stockage local puis redirige vers la page d'accueil
		localStorage.setItem("token", data.token);
		window.location.href = "./index.html";
	} catch (error) {
		console.error("Impossible de se connecter.", error);
		displayLoginError("Une erreur est survenue. Veuillez réessayer.");
	}
}

loginForm.addEventListener("submit", login); // Ajoute un listener sur la soumission du formulaire de connexion