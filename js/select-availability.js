console.log("select-availability.js loaded ✅");

document.addEventListener("DOMContentLoaded", () => {

  const slotsList = document.getElementById("slotsList"); // slots container
  const continueBtn = document.getElementById("continueBtn");

  const API_BASE = "http://127.0.0.1:5000/api"; // backend base url
  const KEY_AVAIL = "zeena_selected_availability"; // localStorage key

  let selected = null;

  function setContinue(enabled){
    continueBtn.disabled = !enabled;
    continueBtn.classList.toggle("is-active", enabled);
  } // toggle continue button

  function clearPressed(){
    document.querySelectorAll(".zeena-time")
      .forEach(btn => btn.setAttribute("aria-pressed","false"));
  } // reset selected slot

  function formatDay(d){
    return d.toLocaleDateString("en-GB",{weekday:"long"});
  } // format day name

  function formatDate(d){
    return d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  } // format full date

  function formatTime(d){
    return d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  } // format time

  function next7days(){
    const days = [];

    for(let i=0;i<7;i++){
      const d = new Date();
      d.setDate(d.getDate()+i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");

      days.push(`${yyyy}-${mm}-${dd}`);
    }

    return days;
  } // build next 7 dates

  function render(groups){ 

    const hasSlots = groups.some(group => group.slots.length > 0);

    if (!hasSlots) {
      slotsList.innerHTML = `
      <section class="zeena-card">
        <h2 class="zeena-day">No available times</h2>
        <p class="zeena-date">
          There are no available slots at the moment. Please try again later.
        </p>
      </section>
      `;
      return;
    }

    slotsList.innerHTML = groups.map(group=>{ // render grouped slots

      if(group.slots.length===0) return ""; 

      const d = new Date(group.slots[0].start_datetime); // use first slot for heading

      return `
      <article class="zeena-card">

        <div class="zeena-card-head">
          <h2 class="zeena-day">${formatDay(d)}</h2>
          <p class="zeena-date">${formatDate(d)}</p>
        </div>

        <div class="zeena-times">

        ${
          group.slots.map(slot=>{

            const dt = new Date(slot.start_datetime); // slot date/time

            return `
            <button
              class="zeena-time"
              type="button"
              data-id="${slot.id}"
              data-datetime="${slot.start_datetime}"
              data-day="${formatDay(dt)}"
              data-date="${formatDate(dt)}"
              data-time="${formatTime(dt)}"
              aria-pressed="false"
            >
            ${formatTime(dt)} 
            </button>
            `;

          }).join("")  
        } 

        </div>

      </article>
      `;

    }).join("");

  }

  async function loadSlots(){ // load available slots

    try {
      slotsList.innerHTML = `
      <section class="zeena-card">
        <p class="zeena-date">Loading available times...</p>
      </section>
      `;

      const dates = next7days();

      const responses = await Promise.all(
        dates.map(d=>fetch(`${API_BASE}/timeslots?date=${d}`))
      ); // fetch each day

      const results = await Promise.all(
        responses.map(r=>r.json())
      ); // parse responses

      const groups = results.map((slots,i)=>{

        const available = slots.filter(s=>s.available); // keep only available slots

        return {
          date:dates[i],
          slots:available
        };

      });

      render(groups);

    } catch (err) {
      console.error("Could not load available slots:", err);

      slotsList.innerHTML = `
      <section class="zeena-card">
        <h2 class="zeena-day">Could not load availability</h2>
        <p class="zeena-date">
          Please make sure the backend server is running and try again.
        </p>
      </section>
      `;
    }

  }

  slotsList.addEventListener("click",(e)=>{

    const btn = e.target.closest(".zeena-time");
    if(!btn) return; // ignore non-slot clicks

    clearPressed();
    btn.setAttribute("aria-pressed","true");

    selected = {
      timeslotId:Number(btn.dataset.id),
      startDateTime:btn.dataset.datetime,
      day:btn.dataset.day,
      date:btn.dataset.date,
      time:btn.dataset.time
    }; // save selected slot

    localStorage.setItem(KEY_AVAIL,JSON.stringify(selected));

    setContinue(true);

  });

  continueBtn.addEventListener("click",()=>{

    if(!selected) return;

    window.location.href="./booking-details.html";

  }); // go to next step

  loadSlots(); // load slots on page open

});