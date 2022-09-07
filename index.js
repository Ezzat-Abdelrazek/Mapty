"use strict";

const map = document.querySelector(".map");

const form = document.querySelector(".form");
const nav = document.querySelector(".nav");

const inputType = document.querySelector(".form__select");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

const containerCadence = document.querySelector(".form__group--cadence");
const containerElevation = document.querySelector(".form__group--elevation");
const containerSidebar = document.querySelector(".sidebar");
const containerLogo = document.querySelector(".logo-box");
const containerNav = document.querySelector(".nav-box");

const spanBtnFront = document.querySelector(".nav__btn--front span");

const btnPath = document.querySelector(".btn--path");
const btnClear = document.querySelector(".btn--clear");
const btnNav = document.querySelector(".nav__btn-group");
const btnNavFront = document.querySelector(".nav__btn-box--front");
const btnNavBack = document.querySelector(".nav__btn-box--back");

const msgPath = document.querySelectorAll(".msg--path");

class App {
  #map;
  #mapE;
  #workouts = [];
  #paths = [];
  #workout;
  #routing;
  #waypoints = [];
  #waypoint = [];
  #path = false;
  #pathCount = 0;
  #renderFormBool = true;

  constructor() {
    this.#getPosition();

    form.addEventListener("submit", this.#submitForm.bind(this));

    btnNav.addEventListener("click", this.#toggleNav.bind(this));
    btnPath.addEventListener("click", this.#drawPath.bind(this));
    btnClear.addEventListener("click", this.#clearWorkout.bind(this));

    inputType.addEventListener("change", this.#toggleElevation.bind(this));
    containerSidebar.addEventListener("click", this.#panMap.bind(this));
  }
  #getPosition() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.#loadmap(pos);
      },
      (pos) => {
        console.log(pos);
      }
    );
  }

  #loadmap(pos) {
    // prettier-ignore
    const {coords: { latitude: lat, longitude: lng }} = pos;

    this.#map = L.map("map").setView([lat, lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(this.#map);

    this.#map.on("click", this.#renderForm.bind(this));
    // this.#map.on("click", function () {});

    this.#getLocalStorage();
  }

  #renderForm(mapEvent) {
    if (!this.#renderFormBool) return;
    this.#mapE = mapEvent;

    form.classList.remove("u-display-none");

    setTimeout(() => form.classList.remove("hidden"), 0);

    inputDistance.focus();
  }
  #hideForm() {
    form.classList.add("u-display-none");
    form.classList.add("hidden");
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = "";
  }
  #submitForm(e) {
    e.preventDefault();
    if (!this.#checkValid()) {
      alert("Please Enter Valid Values");
      return;
    }
    this.#createWorkout();

    this.#renderPopup(this.#workout);

    this.#hideForm(this.#workout);

    if (this.#path) {
      this.#createPath();
      return;
    }

    this.#setLocalStorage();

    this.#renderWorkout(this.#workout);
  }
  #createPath() {
    if (this.#pathCount === 0) {
      // prettier-ignore
      this.#routing.spliceWaypoints(0, 1, this.#workout.coords);
      this.#waypoint.push(this.#workout.coords);
    }
    if (this.#pathCount === 1) {
      // prettier-ignore
      this.#routing.spliceWaypoints(this.#routing.getWaypoints().length - 1, 1, this.#workout.coords);
      const leafletControl = document.querySelector(".leaflet-right");
      leafletControl.style.display = "block";

      this.#pathCount = -1;
      this.#path = false;

      this.#waypoint.push(this.#workout.coords);
      this.#waypoints.push(this.#waypoint);

      this.#setLocalStorage();
    }
    this.#pathCount++;
  }
  #checkValid() {
    if (inputDistance.value <= 0 || inputDuration.value <= 0) return false;
    if (inputType.value === "running" && inputCadence?.value <= 0) return false;
    // prettier-ignore
    if (inputType.value === "cycling" && inputElevation?.value <= 0) return false;
    return true;
  }
  #renderPopup(workout) {
    L.marker(workout.coords).addTo(this.#map);
    L.popup({
      className: `leaflet-popup-content--${workout.type}`,
      autoClose: false,
      closeOnClick: false,
    })
      .setLatLng(workout.coords)
      .setContent(
        `${workout.type === "running" ? "🏃 Running" : "🚴 Cycling"} on ${
          workout.date
        }`
      )
      .openOn(this.#map);
  }

  #toggleElevation() {
    containerCadence.classList.toggle("u-display-none");
    containerElevation.classList.toggle("u-display-none");
  }
  #createWorkout() {
    const distance = inputDistance.value;
    const duration = inputDistance.value;
    const type = inputType.value;
    const cadence = inputCadence.value;
    const elevation = inputElevation.value;

    console.log(type);

    if (type === "running") {
      // prettier-ignore
      this.#workout = new Running(distance,duration,this.#mapE.latlng, cadence);
    }
    if (type === "cycling") {
      //prettier-ignore
      this.#workout = new Cycling(distance, duration, this.#mapE.latlng,elevation);
    }

    if (this.#path) return;
    this.#workouts.push(this.#workout);
  }

  #renderWorkout(workout) {
    let html = `
     <article class="workout workout--${workout.type}" data-id="${workout.id}">
        <p class="workout__date">${
          workout.type === "running" ? "🏃 Running" : "🚴 Cycling"
        } on ${workout.date}</p>
        <p class="workout__distance">${
          workout.type === "running" ? "🏃" : "🚴"
        } ${workout.distance} <span class="workout__span">km</span></p>
        <p class="workout__duration">⏱️ ${
          workout.duration
        } <span class="workout__span">min</span></p>
    `;

    if (workout.type === "running")
      html += `
        <p class="workout__pace">🚶${workout.pace} <span class="workout__span">min/km</span></p>
        <p class="workout__cadence">🦶 ${workout.cadence} <span class="workout__span">spm</span></p>
      </article>
    `;
    if (workout.type === "cycling")
      html += `
      <p class="workout__pace">🚀${workout.speed} <span class="workout__span">km/h</span></p>
      <p class="workout__cadence">🚵 ${workout.elevation} <span class="workout__span">m</span></p>
    `;

    form.insertAdjacentHTML("afterend", html);
  }
  #panMap(e) {
    if (!e.target.closest(".workout")) return;

    const workout = this.#workouts.find(
      (workout) => workout.id === e.target.closest(".workout").dataset.id
    );
    this.#map.panTo(workout.coords, {
      duration: 0.8,
      easeLinearity: 0.5,
    });
  }

  #toggleNav() {
    nav.classList.toggle("nav--hidden");

    this.#hideForm();
    if (containerNav.classList.contains("u-z-index-large")) {
      setTimeout(() => {
        containerNav.classList.remove("u-z-index-large");
      }, 500);
    } else {
      containerNav.classList.add("u-z-index-large");
    }

    btnNavFront.classList.toggle("u-rotateY-180");
    btnNavBack.classList.toggle("u-rotateY-360");

    spanBtnFront.classList.toggle("u-display-none");

    if (this.#renderFormBool) this.#renderFormBool = false;
    else this.#renderFormBool = true;
  }

  #setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    localStorage.setItem("waypoints", JSON.stringify(this.#waypoints));
  }
  #getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem("workouts"));
    const waypoints = JSON.parse(localStorage.getItem("waypoints"));

    if (waypoints) {
      this.#waypoints = waypoints;
      waypoints.forEach((waypoint) => {
        this.#routing = L.Routing.control({
          waypoints: waypoint,
          lineOptions: {
            styles: [{ color: "red", opacity: 1, weight: 2 }],
          },
        }).addTo(this.#map);
      });
    }
    if (workouts) {
      workouts.forEach((workout) => {
        if (workout.type === "running") {
          const id = workout.id;
          const running = new Running(
            workout.distance,
            workout.duration,
            workout.coords,
            workout.cadence
          );
          running.setId(id);
          //prettier-ignore
          this.#workouts.unshift(running);
        }
        //prettier-ignore
        if (workout.type === "cycling") {
          const id = workout.id;
        const cycling = new Cycling(
          workout.distance,
          workout.duration,
          workout.coords,
          workout.elevation
          );
          cycling.setId(id);
          //prettier-ignore
          this.#workouts.unshift(cycling);
        }
        this.#renderWorkout(workout);
        this.#renderPopup(workout);
      });
    }
  }

  #renderMsg() {
    msgPath.forEach((msg) => {
      msg.style.transform = "translate(-20rem)";
    });
  }

  #hideMsg() {
    msgPath.forEach((msg) => {
      msg.style.transform = "translate(20rem)";
    });
  }

  #drawPath(e) {
    this.#toggleNav();
    this.#renderMsg();

    setTimeout(this.#hideMsg.bind(this), 3000);

    this.#renderFormBool = true;
    this.#path = true;

    // this.#pathPoint1 = this.#workouts[this.#workouts.length - 1].coords;

    // this.#pathPoint2 = this.#workouts[this.#workouts.length - 1].coords;
    // console.log(this.#pathPoint1, this.#pathPoint2);
    this.#routing = L.Routing.control({
      lineOptions: {
        styles: [{ color: "#000", opacity: 1, weight: 1 }],
      },
    }).addTo(this.#map);
    // console.log(routing.getWaypoints());
  }
  #clearWorkout() {
    localStorage.clear();

    location.reload();
  }
}

const app = new App();

class Workout {
  id = String(Math.trunc(+Date.now() * Math.random())).slice(-10);
  date = new Intl.DateTimeFormat(navigator.language, {
    day: "numeric",
    month: "long",
  }).format(new Date());
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  setId(id) {
    this.id = id;
  }
}
class Running extends Workout {
  type = "running";
  pace;

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.#calcPace();
  }
  #calcPace() {
    this.pace = (this.distance / this.duration).toFixed(1);
  }
}
class Cycling extends Workout {
  type = "cycling";
  speed;
  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.#calcSpeed();
  }
  #calcSpeed() {
    this.speed = (this.distance / this.duration).toFixed(1);
  }
}

const workout = new Workout(22, 20, [22, 22]);
