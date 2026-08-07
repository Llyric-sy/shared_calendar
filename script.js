import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* ========================================
   SUPABASE
======================================== */

const SUPABASE_URL =
  "https://uyofqzrgyubdsgheuhbl.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_TOj9Iqr3gRFktXxvzYA7kQ_g9-edYzp";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );



/* ========================================
   TEMPLATES
======================================== */

const templates = {

  /* ==================
     TOGETHER
  ================== */

  "date-night": {
    title: "Date night",
    duration: 240
  },


  "day-date": {
    title: "Day date",
    duration: 360
  },


  monthsary: {
    title: "Monthsary",
    duration: 240
  },


  anniversary: {
    title: "Anniversary",
    duration: 360
  },



  /* ==================
     WIND DOWN
  ================== */

  "reading-night": {
    title: "Reading night",
    duration: 90
  },


  "cozy-night": {
    title: "Cozy night",
    duration: 120
  },


  "wind-down": {
    title: "Wind-down time",
    duration: 90
  },


  "creative-night": {
    title: "Creative night",
    duration: 120
  },


  "quiet-time": {
    title: "Quiet time",
    duration: 60
  },


  "self-care-night": {
    title: "Self-care night",
    duration: 90
  },


  "comfort-night": {
    title: "Comfort night",
    duration: 120
  },



  /* ==================
     FUN
  ================== */

  "game-night": {
    title: "Game night",
    duration: 180
  },


  "friends-game-night": {
    title: "Game night with friends",
    duration: 240
  },


  "movie-night": {
    title: "Movie night",
    duration: 180
  },


  "eat-out": {
    title: "Eat out",
    duration: 120
  },


  hangout: {
    title: "Hangout",
    duration: 180
  },


  walk: {
    title: "Walk",
    duration: 90
  },


  "try-something-new": {
    title: "Try something new",
    duration: 180
  },



  /* ==================
     OTHER
  ================== */

  custom: {
    title: "",
    duration: 60
  }

};



/* ========================================
   STATE
======================================== */

const state = {

  currentDate:
    new Date(),

  selectedDate:
    null,

  editingId:
    null,

  editorReadOnly:
    false,

  items:
    [],

  user:
    null,

  profile:
    null,

  members:
    new Map(),

  realtimeChannel:
    null

};



/* ========================================
   AUTH ELEMENTS
======================================== */

const authView =
  document.querySelector(
    "#authView"
  );


const appView =
  document.querySelector(
    "#appView"
  );


const loginForm =
  document.querySelector(
    "#loginForm"
  );


const loginEmail =
  document.querySelector(
    "#loginEmail"
  );


const loginPassword =
  document.querySelector(
    "#loginPassword"
  );


const loginButton =
  document.querySelector(
    "#loginButton"
  );


const loginMessage =
  document.querySelector(
    "#loginMessage"
  );


const logoutButton =
  document.querySelector(
    "#logoutButton"
  );


const currentUserName =
  document.querySelector(
    "#currentUserName"
  );


const currentUserRole =
  document.querySelector(
    "#currentUserRole"
  );


const syncStatus =
  document.querySelector(
    "#syncStatus"
  );



/* ========================================
   MONTH ELEMENTS
======================================== */

const monthLabel =
  document.querySelector(
    "#monthLabel"
  );


const calendarDays =
  document.querySelector(
    "#calendarDays"
  );


const previousMonthButton =
  document.querySelector(
    "#previousMonth"
  );


const nextMonthButton =
  document.querySelector(
    "#nextMonth"
  );


const todayButton =
  document.querySelector(
    "#todayButton"
  );



/* ========================================
   DAILY VIEW ELEMENTS
======================================== */

const dayModal =
  document.querySelector(
    "#dayModal"
  );


const dayTitle =
  document.querySelector(
    "#dayTitle"
  );


const timeline =
  document.querySelector(
    "#timeline"
  );


const closeDayModalButton =
  document.querySelector(
    "#closeDayModal"
  );


const addScheduleButton =
  document.querySelector(
    "#addScheduleButton"
  );



/* ========================================
   EDITOR ELEMENTS
======================================== */

const eventModal =
  document.querySelector(
    "#eventModal"
  );


const eventForm =
  document.querySelector(
    "#eventForm"
  );


const editorLabel =
  document.querySelector(
    "#editorLabel"
  );


const editorHeading =
  document.querySelector(
    "#editorHeading"
  );


const editorMeta =
  document.querySelector(
    "#editorMeta"
  );


const closeEventModalButton =
  document.querySelector(
    "#closeEventModal"
  );


const cancelEditorButton =
  document.querySelector(
    "#cancelEditor"
  );


const deleteEventButton =
  document.querySelector(
    "#deleteEvent"
  );


const saveEventButton =
  document.querySelector(
    "#saveEventButton"
  );


const formMessage =
  document.querySelector(
    "#formMessage"
  );


const itemTypeInput =
  document.querySelector(
    "#itemType"
  );


const planFields =
  document.querySelector(
    "#planFields"
  );


const scheduleFields =
  document.querySelector(
    "#scheduleFields"
  );


const templateSelect =
  document.querySelector(
    "#templateSelect"
  );


const customTitleField =
  document.querySelector(
    "#customTitleField"
  );


const customEventTitle =
  document.querySelector(
    "#customEventTitle"
  );


const scheduleTypeSelect =
  document.querySelector(
    "#scheduleType"
  );


const eventDateInput =
  document.querySelector(
    "#eventDate"
  );


const startTimeSelect =
  document.querySelector(
    "#startTime"
  );


const endTimeSelect =
  document.querySelector(
    "#endTime"
  );


const notesInput =
  document.querySelector(
    "#eventNotes"
  );



/* ========================================
   START APPLICATION
======================================== */

buildTimeOptions();

attachEventListeners();

boot();



/* ========================================
   BOOT
======================================== */

async function boot() {

  setSyncStatus(
    "connecting...",
    true
  );


  const {
    data: {
      session
    }
  } =
    await supabase.auth
      .getSession();


  if (session) {

    await loadAuthenticatedApp(
      session
    );

  } else {

    showLogin();

  }


  supabase.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        if (
          event ===
            "SIGNED_IN" &&
          session
        ) {

          setTimeout(
            () => {

              if (
                state.user?.id !==
                session.user.id
              ) {

                loadAuthenticatedApp(
                  session
                );

              }

            },
            0
          );

        }


        if (
          event ===
          "SIGNED_OUT"
        ) {

          setTimeout(
            () => {

              clearAuthenticatedApp();

            },
            0
          );

        }

      }
    );

}



/* ========================================
   EVENT LISTENERS
======================================== */

function attachEventListeners() {

  loginForm.addEventListener(
    "submit",
    login
  );


  logoutButton.addEventListener(
    "click",
    logout
  );


  previousMonthButton
    .addEventListener(
      "click",
      () => {

        state.currentDate =
          new Date(
            state.currentDate
              .getFullYear(),

            state.currentDate
              .getMonth() - 1,

            1
          );


        renderCalendar();

      }
    );


  nextMonthButton
    .addEventListener(
      "click",
      () => {

        state.currentDate =
          new Date(
            state.currentDate
              .getFullYear(),

            state.currentDate
              .getMonth() + 1,

            1
          );


        renderCalendar();

      }
    );


  todayButton.addEventListener(
    "click",
    () => {

      state.currentDate =
        new Date();


      renderCalendar();

    }
  );


  closeDayModalButton
    .addEventListener(
      "click",
      closeDayView
    );


  addScheduleButton
    .addEventListener(
      "click",
      () => {

        openEditor({

          type:
            "schedule",

          start:
            "09:00",

          end:
            "17:00"

        });

      }
    );


  closeEventModalButton
    .addEventListener(
      "click",
      closeEditor
    );


  cancelEditorButton
    .addEventListener(
      "click",
      closeEditor
    );


  deleteEventButton
    .addEventListener(
      "click",
      deleteCurrentItem
    );


  templateSelect
    .addEventListener(
      "change",
      () => {

        updateCustomTitleField();

        applyTemplateDuration();

      }
    );


  startTimeSelect
    .addEventListener(
      "change",
      () => {

        if (
          itemTypeInput.value ===
            "plan" &&
          templateSelect.value
        ) {

          applyTemplateDuration();

        }

      }
    );


  eventForm.addEventListener(
    "submit",
    saveItem
  );


  dayModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        dayModal
      ) {

        closeDayView();

      }

    }
  );


  eventModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        eventModal
      ) {

        closeEditor();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      if (
        !eventModal
          .classList
          .contains(
            "hidden"
          )
      ) {

        closeEditor();

        return;

      }


      if (
        !dayModal
          .classList
          .contains(
            "hidden"
          )
      ) {

        closeDayView();

      }

    }
  );

}



/* ========================================
   LOGIN
======================================== */

async function login(event) {

  event.preventDefault();


  loginMessage.textContent =
    "";


  loginButton.disabled =
    true;


  loginButton.textContent =
    "Signing in...";


  const email =
    loginEmail
      .value
      .trim();


  const password =
    loginPassword.value;


  const {
    data,
    error
  } =
    await supabase.auth
      .signInWithPassword({

        email,

        password

      });


  if (error) {

    loginMessage.textContent =
      "Incorrect email or password.";


    loginButton.disabled =
      false;


    loginButton.textContent =
      "Sign in";


    return;

  }


  loginPassword.value =
    "";


  await loadAuthenticatedApp(
    data.session
  );


  loginButton.disabled =
    false;


  loginButton.textContent =
    "Sign in";

}



/* ========================================
   LOGOUT
======================================== */

async function logout() {

  await supabase.auth
    .signOut();


  clearAuthenticatedApp();

}



/* ========================================
   LOAD AUTHENTICATED APP
======================================== */

async function loadAuthenticatedApp(
  session
) {

  if (
    !session?.user
  ) {

    showLogin();

    return;

  }


  setSyncStatus(
    "connecting...",
    true
  );


  state.user =
    session.user;



  /* LOAD CURRENT PROFILE */

  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, display_name, role, active"
      )
      .eq(
        "id",
        session.user.id
      )
      .single();


  if (
    profileError ||
    !profile ||
    !profile.active
  ) {

    loginMessage.textContent =
      "This account does not have access to the calendar.";


    await supabase.auth
      .signOut();


    showLogin();


    return;

  }


  state.profile =
    profile;



  /* LOAD BOTH USER NAMES */

  const {
    data: memberRows
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, display_name, role"
      );


  state.members =
    new Map();


  for (
    const member
    of memberRows || []
  ) {

    state.members.set(
      member.id,
      member
    );

  }



  /* ACCOUNT DISPLAY */

  currentUserName.textContent =
    profile.display_name;


  currentUserRole.textContent =
    profile.role ===
      "girlfriend"
      ? "my love"
      : profile.role;



  /* ONLY OWNER SEES SCHEDULE BUTTON */

  addScheduleButton
    .classList
    .toggle(
      "hidden",
      profile.role !==
        "owner"
    );



  /* SHOW APP */

  authView.classList.add(
    "hidden"
  );


  appView.classList.remove(
    "hidden"
  );



  /* LOAD DATABASE */

  await loadItems();



  /*
   * IMPORT OLD LOCAL CALENDAR
   * IF THIS BROWSER STILL HAS IT
   */

  await migrateOldLocalItems();



  /*
   * LOAD AGAIN IN CASE
   * MIGRATION ADDED ITEMS
   */

  await loadItems();



  subscribeToRealtime();


  renderCalendar();


  setSyncStatus(
    "● synced",
    false
  );

}



/* ========================================
   CLEAR AUTHENTICATED APP
======================================== */

function clearAuthenticatedApp() {

  if (
    state.realtimeChannel
  ) {

    supabase.removeChannel(
      state.realtimeChannel
    );

  }


  state.realtimeChannel =
    null;


  state.user =
    null;


  state.profile =
    null;


  state.items =
    [];


  state.members =
    new Map();


  closeEditor();


  closeDayView();


  showLogin();

}



/* ========================================
   SHOW LOGIN
======================================== */

function showLogin() {

  appView.classList.add(
    "hidden"
  );


  authView.classList.remove(
    "hidden"
  );

}



/* ========================================
   LOAD CALENDAR ITEMS
======================================== */

async function loadItems() {

  if (
    !state.user
  ) {

    return;

  }


  setSyncStatus(
    "syncing...",
    true
  );


  const {
    data,
    error
  } =
    await supabase
      .from(
        "calendar_items"
      )
      .select("*")
      .order(
        "event_date",
        {
          ascending:
            true
        }
      )
      .order(
        "start_time",
        {
          ascending:
            true
        }
      );


  if (error) {

    console.error(
      "Could not load calendar:",
      error
    );


    setSyncStatus(
      "sync error",
      true
    );


    return;

  }


  state.items =
    (data || [])
      .map(
        mapDatabaseItem
      );


  setSyncStatus(
    "● synced",
    false
  );

}



/* ========================================
   DATABASE ITEM → APP ITEM
======================================== */

function mapDatabaseItem(item) {

  return {

    id:
      item.id,

    type:
      item.item_type,

    title:
      item.title,

    template:
      item.template,

    date:
      item.event_date,

    start:
      normaliseDatabaseTime(
        item.start_time
      ),

    end:
      normaliseDatabaseTime(
        item.end_time
      ),

    notes:
      item.notes || "",

    category:
      item.category,

    createdBy:
      item.created_by

  };

}



/* ========================================
   REALTIME SYNC
======================================== */

function subscribeToRealtime() {

  if (
    state.realtimeChannel
  ) {

    supabase.removeChannel(
      state.realtimeChannel
    );

  }


  state.realtimeChannel =
    supabase
      .channel(
        "shared-calendar-live"
      )
      .on(

        "postgres_changes",

        {

          event:
            "*",

          schema:
            "public",

          table:
            "calendar_items"

        },

        async () => {

          await loadItems();


          renderCalendar();


          if (
            !dayModal
              .classList
              .contains(
                "hidden"
              )
          ) {

            renderTimeline();

          }

        }

      )
      .subscribe();

}



/* ========================================
   RENDER MONTH
======================================== */

function renderCalendar() {

  const year =
    state.currentDate
      .getFullYear();


  const month =
    state.currentDate
      .getMonth();


  monthLabel.textContent =
    new Intl.DateTimeFormat(
      "en-AU",
      {

        month:
          "long",

        year:
          "numeric"

      }
    )
      .format(
        new Date(
          year,
          month,
          1
        )
      );


  calendarDays.innerHTML =
    "";



  /* FIRST DAY OF MONTH */

  const firstWeekday =
    new Date(
      year,
      month,
      1
    ).getDay();


  /*
   * JS:
   * Sunday = 0
   *
   * Calendar:
   * Monday first
   */

  const mondayFirstOffset =
    (
      firstWeekday +
      6
    ) % 7;



  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();



  const totalCells =
    Math.max(

      35,

      Math.ceil(
        (
          mondayFirstOffset +
          daysInMonth
        ) / 7
      ) * 7

    );


  const todayKey =
    toDateKey(
      new Date()
    );



  for (
    let cellIndex = 0;
    cellIndex < totalCells;
    cellIndex += 1
  ) {

    const dayNumber =
      cellIndex -
      mondayFirstOffset +
      1;



    /* EMPTY CALENDAR BOX */

    if (
      dayNumber < 1 ||
      dayNumber > daysInMonth
    ) {

      const blankCell =
        document.createElement(
          "div"
        );


      blankCell.className =
        "day-cell blank-day";


      calendarDays.append(
        blankCell
      );


      continue;

    }



    /* DATE KEY */

    const dateKey =
      makeDateKey(
        year,
        month,
        dayNumber
      );



    /* DAY BUTTON */

    const dayButton =
      document.createElement(
        "button"
      );


    dayButton.type =
      "button";


    dayButton.className =
      "day-cell";


    dayButton.setAttribute(
      "aria-label",
      formatDateLong(
        dateKey
      )
    );



    if (
      dateKey ===
      todayKey
    ) {

      dayButton.classList.add(
        "today"
      );

    }



    /* DATE NUMBER */

    const number =
      document.createElement(
        "span"
      );


    number.className =
      "day-number";


    number.textContent =
      String(
        dayNumber
      );


    dayButton.append(
      number
    );



    /* EVENT SUMMARY */

    const summary =
      document.createElement(
        "span"
      );


    summary.className =
      "day-summary";


    const dayItems =
      getItemsForDate(
        dateKey
      );


    const visibleItems =
      dayItems.slice(
        0,
        3
      );


    for (
      const item
      of visibleItems
    ) {

      const entry =
        document.createElement(
          "span"
        );


      entry.className =
        `summary-entry ${item.type} ${item.category}`;


      entry.textContent =
        `${item.start} ${item.title}`;


      summary.append(
        entry
      );

    }



    const remaining =
      dayItems.length -
      visibleItems.length;


    if (
      remaining > 0
    ) {

      const more =
        document.createElement(
          "span"
        );


      more.className =
        "more-entry";


      more.textContent =
        `+${remaining} more`;


      summary.append(
        more
      );

    }


    dayButton.append(
      summary
    );



    dayButton.addEventListener(
      "click",
      () => {

        openDayView(
          dateKey
        );

      }
    );


    calendarDays.append(
      dayButton
    );

  }

}



/* ========================================
   OPEN DAY VIEW
======================================== */

function openDayView(
  dateKey
) {

  state.selectedDate =
    dateKey;


  dayTitle.textContent =
    formatDateLong(
      dateKey
    );


  renderTimeline();


  dayModal.classList.remove(
    "hidden"
  );


  document.body.classList.add(
    "modal-open"
  );

}



/* ========================================
   CLOSE DAY VIEW
======================================== */

function closeDayView() {

  dayModal.classList.add(
    "hidden"
  );


  if (
    eventModal
      .classList
      .contains(
        "hidden"
      )
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}



/* ========================================
   RENDER 24 HOUR TIMELINE
======================================== */

function renderTimeline() {

  timeline.innerHTML =
    "";


  /*
   * 48 rows:
   *
   * 00:00
   * 00:30
   * 01:00
   * 01:30
   * ...
   */


  for (
    let slotIndex = 0;
    slotIndex < 48;
    slotIndex += 1
  ) {

    /* TIME LABEL */

    const label =
      document.createElement(
        "div"
      );


    label.className =
      "time-label";


    label.style.gridRow =
      String(
        slotIndex + 1
      );


    label.style.gridColumn =
      "1";


    /*
     * ONLY SHOW:
     *
     * 09:00
     * -------
     * - - - -
     * 10:00
     *
     * xx:30 stays hidden
     */

    if (
      slotIndex % 2 === 0
    ) {

      label.textContent =
        indexToTime(
          slotIndex
        );

    }


    timeline.append(
      label
    );



    /* CLICKABLE SLOT */

    const slot =
      document.createElement(
        "button"
      );


    slot.type =
      "button";


    slot.className =
      slotIndex % 2 === 0
        ? "time-slot whole-hour"
        : "time-slot half-hour";


    slot.style.gridRow =
      String(
        slotIndex + 1
      );


    slot.style.gridColumn =
      "2";


    const slotTime =
      indexToTime(
        slotIndex
      );


    slot.setAttribute(
      "aria-label",
      `Create a plan at ${slotTime}`
    );


    slot.title =
      `Create a plan at ${slotTime}`;


    slot.addEventListener(
      "click",
      () => {

        const startMinutes =
          timeToMinutes(
            slotTime
          );


        const endMinutes =
          Math.min(
            startMinutes + 60,
            1440
          );


        openEditor({

          type:
            "plan",

          start:
            slotTime,

          end:
            minutesToTime(
              endMinutes
            )

        });

      }
    );


    timeline.append(
      slot
    );

  }



  /* EXISTING EVENTS */

  const dayItems =
    getItemsForDate(
      state.selectedDate
    );


  for (
    const item
    of dayItems
  ) {

    const startIndex =
      timeToMinutes(
        item.start
      ) / 30;


    const endIndex =
      timeToMinutes(
        item.end
      ) / 30;


    if (
      !Number.isInteger(
        startIndex
      ) ||
      !Number.isInteger(
        endIndex
      ) ||
      endIndex <= startIndex
    ) {

      continue;

    }



    const eventBlock =
      document.createElement(
        "button"
      );


    eventBlock.type =
      "button";


    eventBlock.className =
      `event-block ${item.type} ${item.category}`;


    eventBlock.style.gridRow =
      `${startIndex + 1} / ${endIndex + 1}`;


    eventBlock.style.gridColumn =
      "2";



    /* EVENT TITLE */

    const eventTitle =
      document.createElement(
        "strong"
      );


    eventTitle.textContent =
      item.title;



    /* EVENT DETAILS */

    const eventDetails =
      document.createElement(
        "span"
      );


    const creator =
      getMemberName(
        item.createdBy
      );


    eventDetails.textContent =
      item.type ===
        "plan"

        ? `${item.start}–${item.end} · ${creator}`

        : `${item.start}–${item.end}`;


    eventBlock.append(
      eventTitle,
      eventDetails
    );


    eventBlock.addEventListener(
      "click",
      () => {

        openEditor({
          item
        });

      }
    );


    timeline.append(
      eventBlock
    );

  }

}



/* ========================================
   CUSTOM EVENT FIELD
======================================== */

function updateCustomTitleField() {

  const customSelected =
    templateSelect.value ===
    "custom";


  customTitleField
    .classList
    .toggle(
      "hidden",
      !customSelected
    );


  customEventTitle.required =
    customSelected;


  if (
    !customSelected
  ) {

    customEventTitle.value =
      "";

  }

}



/* ========================================
   OPEN EVENT EDITOR
======================================== */

function openEditor({

  type = "plan",

  start = "09:00",

  end = "10:00",

  item = null

} = {}) {


  eventForm.reset();


  formMessage.textContent =
    "";


  formMessage.classList.remove(
    "success"
  );


  state.editingId =
    item?.id ??
    null;



  const itemType =
    item?.type ??
    type;


  itemTypeInput.value =
    itemType;


  const isPlan =
    itemType ===
    "plan";



  const canEdit =
    item
      ? canEditItem(
          item
        )
      : (
          isPlan ||
          isOwner()
        );


  state.editorReadOnly =
    !canEdit;



  /* SHOW CORRECT FORM */

  planFields.classList.toggle(
    "hidden",
    !isPlan
  );


  scheduleFields.classList.toggle(
    "hidden",
    isPlan
  );



  /* EDIT EXISTING ITEM */

  if (item) {

    editorLabel.textContent =
      canEdit
        ? "edit event"
        : "view event";


    editorHeading.textContent =
      item.title;


    editorMeta.textContent =
      `created by ${getMemberName(
        item.createdBy
      )}`;


    saveEventButton.textContent =
      "Save changes";

  }


  /* NEW ITEM */

  else {

    editorLabel.textContent =
      isPlan
        ? "create a plan"
        : "add my schedule";


    editorHeading.textContent =
      isPlan
        ? "Add an event"
        : "Add my schedule";


    editorMeta.textContent =
      "";


    saveEventButton.textContent =
      isPlan
        ? "Add event"
        : "Add schedule";

  }



  /*
   * TEMPLATE
   *
   * If an older event used a removed
   * template such as "dinner" or "cafe",
   * turn it into a Custom event when editing.
   */

  if (
    item &&
    isPlan
  ) {

    if (
      item.template &&
      templates[
        item.template
      ]
    ) {

      templateSelect.value =
        item.template;

    } else {

      templateSelect.value =
        "custom";

    }

  } else {

    templateSelect.value =
      "";

  }



  /*
   * CUSTOM TITLE
   */

  if (
    item &&
    isPlan &&
    (
      item.template ===
        "custom" ||
      !templates[
        item.template
      ]
    )
  ) {

    customEventTitle.value =
      item.title || "";

  } else {

    customEventTitle.value =
      "";

  }


  updateCustomTitleField();



  /* SCHEDULE CATEGORY */

  scheduleTypeSelect.value =
    item?.category ===
      "busy"
      ? "busy"
      : "work";



  /* DATE */

  eventDateInput.value =
    item?.date ||
    state.selectedDate ||
    toDateKey(
      new Date()
    );



  /* TIMES */

  startTimeSelect.value =
    item?.start ||
    start;


  endTimeSelect.value =
    item?.end ||
    end;



  /* NOTES */

  notesInput.value =
    item?.notes ||
    "";



  /* PERMISSIONS */

  setEditorDisabled(
    !canEdit
  );


  deleteEventButton
    .classList
    .toggle(

      "hidden",

      !item ||
      !canEdit

    );


  saveEventButton
    .classList
    .toggle(
      "hidden",
      !canEdit
    );


  cancelEditorButton.textContent =
    canEdit
      ? "Cancel"
      : "Close";



  /* OPEN */

  eventModal.classList.remove(
    "hidden"
  );


  document.body.classList.add(
    "modal-open"
  );

}



/* ========================================
   EDIT PERMISSIONS
======================================== */

function canEditItem(item) {

  /*
   * OWNER CAN EDIT EVERYTHING
   */

  if (
    isOwner()
  ) {

    return true;

  }


  /*
   * GIRLFRIEND CAN EDIT
   * HER OWN SHARED PLANS
   */

  return (

    item.type ===
      "plan" &&

    item.createdBy ===
      state.user?.id

  );

}



/* ========================================
   OWNER CHECK
======================================== */

function isOwner() {

  return (
    state.profile?.role ===
    "owner"
  );

}



/* ========================================
   DISABLE EDITOR
======================================== */

function setEditorDisabled(
  disabled
) {

  templateSelect.disabled =
    disabled;


  customEventTitle.disabled =
    disabled;


  scheduleTypeSelect.disabled =
    disabled;


  eventDateInput.disabled =
    disabled;


  startTimeSelect.disabled =
    disabled;


  endTimeSelect.disabled =
    disabled;


  notesInput.disabled =
    disabled;

}



/* ========================================
   CLOSE EDITOR
======================================== */

function closeEditor() {

  eventModal.classList.add(
    "hidden"
  );


  state.editingId =
    null;


  state.editorReadOnly =
    false;


  formMessage.textContent =
    "";


  setEditorDisabled(
    false
  );


  if (
    dayModal
      .classList
      .contains(
        "hidden"
      )
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}



/* ========================================
   TEMPLATE DEFAULT DURATION
======================================== */

function applyTemplateDuration() {

  const selectedTemplate =
    templates[
      templateSelect.value
    ];


  if (
    !selectedTemplate
  ) {

    return;

  }


  const startMinutes =
    timeToMinutes(
      startTimeSelect.value
    );


  const newEndMinutes =
    Math.min(

      startMinutes +
      selectedTemplate.duration,

      1440

    );


  endTimeSelect.value =
    minutesToTime(
      newEndMinutes
    );

}



/* ========================================
   SAVE ITEM
======================================== */

async function saveItem(event) {

  event.preventDefault();


  if (
    state.editorReadOnly
  ) {

    return;

  }


  formMessage.textContent =
    "";


  formMessage.classList.remove(
    "success"
  );


  const type =
    itemTypeInput.value;


  const date =
    eventDateInput.value;


  const start =
    startTimeSelect.value;


  const end =
    endTimeSelect.value;



  /* DATE VALIDATION */

  if (!date) {

    showFormError(
      "Please select a date."
    );


    return;

  }



  /* TIME VALIDATION */

  const startMinutes =
    timeToMinutes(
      start
    );


  const endMinutes =
    timeToMinutes(
      end
    );


  if (
    endMinutes <=
    startMinutes
  ) {

    showFormError(
      "The end time must be later than the start time."
    );


    return;

  }



  let title;

  let template =
    null;

  let category;



  /* ========================================
     SHARED PLAN
  ======================================== */

  if (
    type ===
    "plan"
  ) {

    template =
      templateSelect.value;


    const selectedTemplate =
      templates[
        template
      ];


    if (
      !selectedTemplate
    ) {

      showFormError(
        "Please select a template."
      );


      return;

    }



    /*
     * CUSTOM EVENT
     */

    if (
      template ===
      "custom"
    ) {

      title =
        customEventTitle
          .value
          .trim();


      if (!title) {

        showFormError(
          "Please type the event name."
        );


        customEventTitle.focus();


        return;

      }

    }


    /*
     * NORMAL TEMPLATE
     */

    else {

      title =
        selectedTemplate.title;

    }


    category =
      "plan";

  }



  /* ========================================
     OWNER SCHEDULE
  ======================================== */

  else {

    if (
      !isOwner()
    ) {

      showFormError(
        "Only the owner can change the schedule."
      );


      return;

    }


    category =
      scheduleTypeSelect.value;


    title =
      category ===
        "work"
        ? "Work"
        : "Busy";

  }



  /* ========================================
     OVERLAP CHECK
  ======================================== */

  const conflictingItem =
    state.items.find(
      item => {

        /*
         * IGNORE CURRENT ITEM
         * WHILE EDITING
         */

        if (
          item.id ===
            state.editingId ||
          item.date !==
            date
        ) {

          return false;

        }


        const existingStart =
          timeToMinutes(
            item.start
          );


        const existingEnd =
          timeToMinutes(
            item.end
          );


        return (

          startMinutes <
            existingEnd &&

          endMinutes >
            existingStart

        );

      }
    );


  if (
    conflictingItem
  ) {

    showFormError(

      `This overlaps with “${conflictingItem.title}” from ${conflictingItem.start} to ${conflictingItem.end}.`

    );


    return;

  }



  /* ========================================
     DATABASE PAYLOAD
  ======================================== */

  const payload = {

    item_type:
      type,

    title,

    template:
      type ===
        "plan"
        ? template
        : null,

    event_date:
      date,

    start_time:
      start,

    end_time:
      end,

    notes:
      notesInput
        .value
        .trim(),

    category

  };



  saveEventButton.disabled =
    true;


  saveEventButton.textContent =
    "Saving...";


  let error;



  /* ========================================
     UPDATE EXISTING
  ======================================== */

  if (
    state.editingId
  ) {

    const result =
      await supabase
        .from(
          "calendar_items"
        )
        .update(
          payload
        )
        .eq(
          "id",
          state.editingId
        );


    error =
      result.error;

  }



  /* ========================================
     CREATE NEW
  ======================================== */

  else {

    const result =
      await supabase
        .from(
          "calendar_items"
        )
        .insert(
          payload
        );


    error =
      result.error;

  }



  saveEventButton.disabled =
    false;



  /* ========================================
     ERROR
  ======================================== */

  if (error) {

    console.error(
      "Save error:",
      error
    );


    saveEventButton.textContent =
      state.editingId
        ? "Save changes"
        : (
            type ===
              "plan"
              ? "Add event"
              : "Add schedule"
          );


    showFormError(
      "Could not save the event."
    );


    return;

  }



  /* ========================================
     SUCCESS
  ======================================== */

  state.selectedDate =
    date;


  const selectedDateObject =
    new Date(
      `${date}T00:00:00`
    );


  state.currentDate =
    new Date(

      selectedDateObject
        .getFullYear(),

      selectedDateObject
        .getMonth(),

      1

    );


  await loadItems();


  dayTitle.textContent =
    formatDateLong(
      date
    );


  closeEditor();


  renderTimeline();


  renderCalendar();

}



/* ========================================
   DELETE ITEM
======================================== */

async function deleteCurrentItem() {

  if (
    !state.editingId
  ) {

    return;

  }


  const item =
    state.items.find(
      entry =>
        entry.id ===
        state.editingId
    );


  if (
    !item ||
    !canEditItem(
      item
    )
  ) {

    return;

  }



  deleteEventButton.disabled =
    true;


  deleteEventButton.textContent =
    "Deleting...";



  const {
    error
  } =
    await supabase
      .from(
        "calendar_items"
      )
      .delete()
      .eq(
        "id",
        state.editingId
      );



  deleteEventButton.disabled =
    false;


  deleteEventButton.textContent =
    "Delete";



  if (error) {

    console.error(
      "Delete error:",
      error
    );


    showFormError(
      "Could not delete the event."
    );


    return;

  }



  await loadItems();


  closeEditor();


  renderTimeline();


  renderCalendar();

}



/* ========================================
   OLD LOCAL STORAGE MIGRATION
======================================== */

async function migrateOldLocalItems() {

  const migrationMarker =
    "shared_calendar_supabase_migrated_v1";


  /*
   * ONLY OWNER SHOULD IMPORT
   * OLD LOCAL SCHEDULES
   */

  if (
    !isOwner()
  ) {

    return;

  }


  /*
   * ALREADY MIGRATED
   */

  if (
    localStorage.getItem(
      migrationMarker
    ) ===
    "yes"
  ) {

    return;

  }


  /*
   * DON'T IMPORT INTO
   * NON-EMPTY DATABASE
   */

  if (
    state.items.length > 0
  ) {

    localStorage.setItem(
      migrationMarker,
      "yes"
    );


    return;

  }



  const possibleKeys = [

    "shared_calendar_items_v2",

    "shared_calendar_items_v1"

  ];


  let oldItems =
    [];



  for (
    const key
    of possibleKeys
  ) {

    try {

      const raw =
        localStorage.getItem(
          key
        );


      if (!raw) {

        continue;

      }


      const parsed =
        JSON.parse(
          raw
        );


      if (
        Array.isArray(
          parsed
        ) &&
        parsed.length
      ) {

        oldItems =
          parsed;


        break;

      }

    } catch (error) {

      console.warn(
        "Could not read old calendar data:",
        error
      );

    }

  }



  /*
   * NOTHING TO IMPORT
   */

  if (
    !oldItems.length
  ) {

    localStorage.setItem(
      migrationMarker,
      "yes"
    );


    return;

  }



  const rows =
    [];



  for (
    const item
    of oldItems
  ) {

    if (
      !item.date ||
      !item.start ||
      !item.end
    ) {

      continue;

    }



    const type =
      item.type ===
        "schedule"
        ? "schedule"
        : "plan";


    let category;



    if (
      type ===
      "schedule"
    ) {

      category =
        item.category ===
          "busy"
          ? "busy"
          : "work";

    } else {

      category =
        "plan";

    }



    rows.push({

      item_type:
        type,

      title:
        item.title ||
        (
          type ===
            "schedule"
            ? (
                category ===
                  "work"
                  ? "Work"
                  : "Busy"
              )
            : "Plan"
        ),

      template:
        type ===
          "plan"
          ? (
              item.template ||
              "custom"
            )
          : null,

      event_date:
        item.date,

      start_time:
        normaliseDatabaseTime(
          item.start
        ),

      end_time:
        normaliseDatabaseTime(
          item.end
        ),

      notes:
        item.notes || "",

      category

    });

  }



  if (
    !rows.length
  ) {

    localStorage.setItem(
      migrationMarker,
      "yes"
    );


    return;

  }



  const {
    error
  } =
    await supabase
      .from(
        "calendar_items"
      )
      .insert(
        rows
      );



  if (error) {

    console.error(
      "Old calendar import failed:",
      error
    );


    return;

  }



  localStorage.setItem(
    migrationMarker,
    "yes"
  );

}



/* ========================================
   BUILD TIME OPTIONS
======================================== */

function buildTimeOptions() {

  startTimeSelect.innerHTML =
    "";


  endTimeSelect.innerHTML =
    "";



  /*
   * START:
   * 00:00 → 23:30
   */

  for (
    let index = 0;
    index < 48;
    index += 1
  ) {

    const time =
      indexToTime(
        index
      );


    startTimeSelect.add(

      new Option(
        time,
        time
      )

    );

  }



  /*
   * END:
   * 00:30 → 24:00
   */

  for (
    let index = 1;
    index <= 48;
    index += 1
  ) {

    const time =
      indexToTime(
        index
      );


    endTimeSelect.add(

      new Option(
        time,
        time
      )

    );

  }

}



/* ========================================
   GET ITEMS FOR DATE
======================================== */

function getItemsForDate(
  dateKey
) {

  return state.items

    .filter(
      item =>
        item.date ===
        dateKey
    )

    .sort(
      (
        first,
        second
      ) => {

        return (

          timeToMinutes(
            first.start
          )

          -

          timeToMinutes(
            second.start
          )

        );

      }
    );

}



/* ========================================
   GET MEMBER DISPLAY NAME
======================================== */

function getMemberName(
  userId
) {

  return (

    state.members
      .get(
        userId
      )
      ?.display_name

    ||

    "member"

  );

}



/* ========================================
   DATE HELPERS
======================================== */

function makeDateKey(

  year,

  zeroBasedMonth,

  day

) {

  const month =
    String(
      zeroBasedMonth + 1
    )
      .padStart(
        2,
        "0"
      );


  const date =
    String(
      day
    )
      .padStart(
        2,
        "0"
      );


  return (
    `${year}-${month}-${date}`
  );

}



function toDateKey(
  date
) {

  return makeDateKey(

    date.getFullYear(),

    date.getMonth(),

    date.getDate()

  );

}



function formatDateLong(
  dateKey
) {

  const date =
    new Date(
      `${dateKey}T00:00:00`
    );


  return new Intl
    .DateTimeFormat(
      "en-AU",
      {

        weekday:
          "long",

        day:
          "numeric",

        month:
          "long",

        year:
          "numeric"

      }
    )
    .format(
      date
    );

}



/* ========================================
   TIME HELPERS
======================================== */

function indexToTime(
  index
) {

  return minutesToTime(
    index * 30
  );

}



function minutesToTime(
  totalMinutes
) {

  if (
    totalMinutes ===
    1440
  ) {

    return "24:00";

  }


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes %
    60;


  return (

    String(
      hours
    )
      .padStart(
        2,
        "0"
      )

    +

    ":"

    +

    String(
      minutes
    )
      .padStart(
        2,
        "0"
      )

  );

}



function timeToMinutes(
  time
) {

  if (
    time ===
    "24:00"
  ) {

    return 1440;

  }


  const [
    hours,
    minutes
  ] =
    normaliseDatabaseTime(
      time
    )
      .split(":")
      .map(Number);


  return (
    hours * 60 +
    minutes
  );

}



function normaliseDatabaseTime(
  time
) {

  if (!time) {

    return "00:00";

  }


  return String(
    time
  )
    .slice(
      0,
      5
    );

}



/* ========================================
   ERROR MESSAGE
======================================== */

function showFormError(
  message
) {

  formMessage.textContent =
    message;


  formMessage.classList.remove(
    "success"
  );

}



/* ========================================
   SYNC STATUS
======================================== */

function setSyncStatus(
  text,
  syncing
) {

  syncStatus.textContent =
    text;


  syncStatus.classList.toggle(
    "syncing",
    syncing
  );

}