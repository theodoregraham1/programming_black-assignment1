"use strict";

const TAXONOMY_ORDER = ["Species", "Genus", "Family", "Order", "Class"];
let CLASS;

document.addEventListener("DOMContentLoaded", async function () {
    CLASS = await getTaxon(0);
    document.getElementById("nav-index-btn").addEventListener("click", loadIndex);
    document.getElementById("nav-browse-btn").addEventListener("click", loadBrowse);
    document.getElementById("nav-add-btn").addEventListener("click", loadAdd)

    await loadBrowse();
})

async function loadIndex() {
    let bod = document.getElementById("main-container")
    clearElement(bod)

    let h2 = document.createElement("h2");
    h2.classList.add("mb-3", "text-center");
    h2.appendChild(document.createTextNode("Home"));
    bod.appendChild(h2);

    const NUMBER_OF_CARDS = 3;
    let row = document.createElement("div");
    row.className = "row";

    try {
        let response = await fetch(`index/cards/${NUMBER_OF_CARDS}`);
        let content = await response.json();

        content.forEach(bird => row.appendChild(makeCard(bird)));
    } catch (e) {
        alert(e);
    }
    bod.appendChild(row);
}

function makeCard(data) {
    // Constant elements
    let col = document.createElement("div");
    col.classList.add("col-lg-auto", "mb-3");

    let card = document.createElement("div");
    card.className = "card";
    col.appendChild(card);

    let img = document.createElement("img");
    img.alt = "..."; // do
    img.className = "card-img-top";
    img.style.width = "300px";
    card.style.maxWidth = "300px";
    card.appendChild(img);

    let card_bod = document.createElement("div");
    card_bod.className = "card-body";
    card.appendChild(card_bod);

    let card_title = document.createElement("h4");
    card_title.className = "card-title";
    card_bod.appendChild(card_title);

    let card_text = document.createElement("p");
    card_text.className = "card-text";
    card_bod.appendChild(card_text);

    let card_btn = document.createElement("button");
    card_btn.classList.add("btn", "btn-primary");
    card_btn.appendChild(document.createTextNode("Read more"));
    card_bod.appendChild(card_btn);

    try {
        let {id, name, description, picture} = data;

        img.src = picture;
        card_title.appendChild(document.createTextNode(name));

        card_text.appendChild(document.createTextNode(description));
        card_btn.id = `card-${id}-btn`;
        card_btn.addEventListener("click", () => loadBird(data))

    } catch (e) {
        // Replace it with placeholder
        img.src = "...";

        card_title.classList.add("placeholder-glow");
        let title_holder = document.createElement("span");
        title_holder.classList.add("col-6", "placeholder");
        card_title.appendChild(title_holder)

        for (let i=0; i<3; i++) {
            let description_holder = document.createElement("span");
            description_holder.classList.add("col-8", "placeholder");
            card_text.appendChild(description_holder)
        }
    }

    return col;
}

function loadBrowse () {
    /*
    TODO: Use css to better display levels (colours) (later)
     */
    let bod = document.getElementById("main-container");
    clearElement(bod);

    // Headers
    let h2 = document.createElement("h2");
    h2.classList.add("mb-3", "text-center");
    h2.appendChild(document.createTextNode("Browse"));
    bod.appendChild(h2);

    let h3 = document.createElement("h3");
    h3.className = "mb-3";
    h3.appendChild(document.createTextNode(CLASS.name));
    bod.appendChild(h3);

    bod.append(createBrowseLevel(TAXONOMY_ORDER.length-1, CLASS, "browse-accordion"));
}

function createBrowseLevel (level, parent, parent_level_id) {
    let level_list = document.createElement("div");
    level_list.classList.add("accordion","accordion-flush", "mt-3");
    level_list.id = `${parent_level_id}-list`;

    let new_level = level-1
    fetch(`get/levels/${parent.id}`)
        .then(response => response.json())
        .then(content => content.forEach(child => {
            // Load children
            let item_id = `${parent_level_id}-${child.id}`;
            let item = createAccordionItem(item_id, child, level_list.id)

            level_list.appendChild(item);

            let btn = document.createElement("button");
            btn.appendChild(document.createTextNode(`View ${TAXONOMY_ORDER[new_level]}`))
            btn.classList.add("btn", "btn-sm", "btn-success")
            document.getElementById(`${item_id}-body`).appendChild(btn);

            if (new_level > 0) {
                // If the level of the next item is a taxon, load its children when it is opened
                let opener = document.getElementById(`${item_id}-opener`);
                opener.addEventListener("click", () => {
                    document.getElementById(`${item_id}-body`).appendChild(
                        createBrowseLevel(new_level, child, item_id)
                    )
                }, {once: true}); // Children only ever need to be loaded once

                btn.addEventListener("click", () => loadTaxon(child));
            } else {
                btn.addEventListener("click", () => loadBird(child));
            }
        }));

    return level_list
}

function createAccordionItem (item_id, item, parent_id) {
    // Create element
    let new_li = document.createElement("div");
    new_li.className = "accordion-item";
    new_li.id = `${item_id}-container`

    // Create title section
    let title = document.createElement("p");
    title.className = "accordion-header";

    let opener = document.createElement("button");
    opener.classList.add("accordion-button", "collapsed");
    opener.id = `${item_id}-opener`
    opener.type = "button";
    opener.setAttribute("data-bs-toggle", "collapse");
    opener.setAttribute("data-bs-target", `#${item_id}`);
    opener.ariaExpanded = "false";
    opener.setAttribute("aria-controls", item_id);
    opener.appendChild(document.createTextNode(item.name));
    title.appendChild(opener)
    new_li.appendChild(title)

    // Create body section
    let acc_collapse = document.createElement("div");
    acc_collapse.id = item_id;
    acc_collapse.classList.add("accordion-collapse", "collapse");
    acc_collapse.setAttribute("data-bs-parent", `#${parent_id}`);

    let acc_body = document.createElement("div");
    acc_body.className = "accordion-body";
    acc_body.id = `${item_id}-body`

    let p = document.createElement("p");
    p.appendChild(document.createTextNode(item.description));
    acc_body.appendChild(p);

    acc_collapse.appendChild(acc_body);
    new_li.appendChild(acc_collapse);

    return new_li
}

function loadAdd() {
    let bod = document.getElementById("main-container");
    clearElement(bod);

    let h2 = document.createElement("h2");
    h2.classList.add("my-3", "text-center");
    h2.appendChild(document.createTextNode("Add"));
    bod.appendChild(h2);

    // Setup breadcrumb
    let breadcrumb = document.createElement("nav");
    breadcrumb.classList.add("mx-auto", "col-md-6")
    breadcrumb.ariaLabel = "breadcrumb";
    bod.appendChild(breadcrumb);

    let bread_ol = document.createElement("ol");
    bread_ol.id = "breadcrumb-ol"
    bread_ol.className = "breadcrumb";
    breadcrumb.append(bread_ol);

    let order_item = document.createElement("li");
    order_item.className = "breadcrumb-item";
    order_item.appendChild(document.createTextNode(CLASS.name))
    bread_ol.appendChild(order_item);

    // Setup dropdown
    let bread_dropdown = document.createElement("div");
    bread_dropdown.className = "dropdown";
    bread_dropdown.id = "breadcrumb-dropdown"

    createBreadcrumbDropdownInner(CLASS, TAXONOMY_ORDER.length-2, bread_dropdown);

    let drop_item = document.createElement("li");
    drop_item.id = "breadcrumb-dropdown-li"
    drop_item.className = "breadcrumb-item";
    drop_item.style.width = Math.ceil(bread_dropdown.clientWidth * 1.2).toString();
    drop_item.appendChild(bread_dropdown);
    bread_ol.appendChild(drop_item);

    // Make div for stuff to go in
    let form_div = document.createElement("div");
    form_div.id = "add-form-div";
    bod.appendChild(form_div);

    loadAddPlaceholder();
}

function loadAddPlaceholder() {
    let container = document.getElementById("add-form-div");
    clearElement(container);

    let holder_div = document.createElement("div");
    holder_div.classList.add("col-3", "mb-3", "mx-auto");
    holder_div.appendChild(document.createTextNode("Select taxonomy level to add child to"));
    container.appendChild(holder_div);
}

function loadGeneralCreator() {
    let container = document.getElementById("add-form-div");
    clearElement(container);

    let form = document.createElement("form");
    form.classList.add("row", "mx-5");
    container.appendChild(form);

    let inputs_div = document.createElement("div");
    inputs_div.classList.add("col-md-6");
    inputs_div.id = "add-form-inputs";
    form.appendChild(inputs_div);

    let title_div = document.createElement("div");
    title_div.classList.add("mb-3", "mx-auto")
    inputs_div.append(title_div)

    let title_input = document.createElement("input");
    title_input.classList.add("form-control");
    title_input.type = "text";
    title_input.placeholder = "Name";
    title_input.name = "name";
    title_input.required = true;
    title_div.appendChild(title_input);

    let description_div = document.createElement("div");
    description_div.classList.add("mb-3", "mx-auto");
    inputs_div.appendChild(description_div);

    let description_input = document.createElement("textarea")
    description_input.classList.add("form-control")
    description_input.placeholder = "Bird description"
    description_input.name = "description";
    description_input.required = true;
    description_div.appendChild(description_input);

    return form;
}

function loadBirdCreator(genus) {
    // Create bird creator form
    let form = loadGeneralCreator();
    let inputs_div = document.getElementById("add-form-inputs");
    inputs_div.classList.add("ms-auto");

    // Picture input element
    let picture_div = document.createElement("div");
    picture_div.classList.add("mb-3", "mx-auto");
    inputs_div.appendChild(picture_div);

    let picture_input = document.createElement("input")
    picture_input.classList.add("form-control")
    picture_input.type = "url";
    picture_input.placeholder = "Picture URL"
    picture_input.name = "picture";
    picture_div.appendChild(picture_input)

    let submit_button = document.createElement("button");
    submit_button.classList.add("btn", "btn-success");
    submit_button.appendChild(document.createTextNode("Add new bird"))
    inputs_div.appendChild(submit_button);

    // Give picture preview
    let preview_div = document.createElement("div");
    preview_div.classList.add("col-md-6", "me-auto", "border")
    form.appendChild(preview_div);

    let preview_label = document.createElement("h5");
    preview_label.classList.add("mx-auto", "pt-3")
    preview_label.appendChild(document.createTextNode("Picture preview"));
    preview_div.appendChild(preview_label);

    let picture_preview = document.createElement("img");
    picture_preview.hidden = true;
    picture_preview.ariaHidden = "hidden";
    picture_preview.classList.add("p-3", "mx-auto", "object-fit-contain");
    picture_preview.width = Math.ceil(preview_div.clientWidth * 0.7);
    preview_div.appendChild(picture_preview)

    picture_input.addEventListener("input", () => {
        picture_preview.src = picture_input.value;
        picture_preview.hidden = false;
        picture_preview.ariaHidden = "show";
    });

    window.addEventListener("resize", () => {
        picture_preview.width = Math.ceil(preview_div.clientWidth * 0.7);
    });

    // Submitter for form
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            let data = new FormData(form);
            data = Object.fromEntries(data.entries());
            data.genus = genus.id;
            let response = await fetch("/add/species/", {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            let content = await response.json();
            loadBird(content);
        } catch (e) {
            alert(e);
        }
    })

}

function loadTaxonCreator(parent, level) {
    // Load creator for a new taxon
    let form = loadGeneralCreator();
    let inputs_div = document.getElementById("add-form-inputs");
    inputs_div.classList.add("mx-auto");

    // TODO: Show other children of the parent to the side

    let submit_button = document.createElement("button");
    submit_button.classList.add("btn", "btn-success");
    submit_button.appendChild(document.createTextNode(`Add new ${TAXONOMY_ORDER[level]}`))
    inputs_div.appendChild(submit_button);

    // Submitter for form
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            let data = new FormData(form);
            data = Object.fromEntries(data.entries());
            data.parent = parent.id;

            let response = await fetch("add/level/", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
            let content = await response.json();

            loadAddPlaceholder();

            await updateBreadcrumb(content, level-1);
        } catch (e) {
            alert(e);
        }
    })
}

function updateBreadcrumb (choice, level) {
    // TODO: Back button
    let dropdown_container = document.getElementById("breadcrumb-dropdown-li");

    let bread_item = document.createElement("li");
    bread_item.className = "breadcrumb-item";
    bread_item.appendChild(document.createTextNode(choice.name));

    dropdown_container.insertAdjacentElement("beforebegin", bread_item);

    if (level >= 1) {
        // Reset dropdown
        clearElement(dropdown_container);
        createBreadcrumbDropdownInner(choice, level, dropdown_container);
    } else {
        dropdown_container.hidden = true;
        loadBirdCreator(choice)
    }
}

function loadSearch (query) {
    // TODO
}

function loadBirdFromId(bird_id) {

}

function loadGeneralItem(item) {
    let bod = document.getElementById("main-container");
    clearElement(bod);
}

function loadBird(bird) {
    loadGeneralItem(bird);
}

function loadTaxonFromId(taxon_id) {
    // TODO
}

function loadTaxon(taxon) {
    loadGeneralItem(taxon);
}

async function createBreadcrumbDropdownInner (parent, level, container) {
    let btn = document.createElement("span");
    btn.classList.add("dropdown-toggle", "badge", "bg-primary");
    btn.ariaExpanded = "false";
    btn.type = "button";
    btn.setAttribute("data-bs-toggle", "dropdown");
    btn.appendChild(document.createTextNode("Select " + TAXONOMY_ORDER[level]));
    container.appendChild(btn);

    let options = document.createElement("ul");
    options.className = "dropdown-menu";
    container.appendChild(options);

    try {
        let response = await fetch(`get/levels/${parent.id}`);
        let choices = await response.json();

        for (let i = 0; i < choices.length; i++) {
            let li = document.createElement("li");
            li.id = `breadcrumb-dropdown-option-${level}-${i}`
            li.className = "dropdown-item";
            li.appendChild(document.createTextNode(choices[i].name));
            options.appendChild(li)

            li.addEventListener("click", () => updateBreadcrumb(choices[i], level - 1));
        }
    } catch (e) {
        alert(e);

        clearElement(options);
    }

    let new_li = document.createElement("li");
    new_li.id = `breadcrumb-dropdown-${level}-new`
    new_li.className = "dropdown-item";
    new_li.appendChild(document.createTextNode(`Create new ${TAXONOMY_ORDER[level]}`));
    options.appendChild(new_li)

    new_li.addEventListener("click", () => loadTaxonCreator(parent, level))
}

async function getTaxon(id) {
    try {
        let response = await fetch(`get/entity/taxon/${id}`)

        return await response.json()
    } catch (e) {
        throw e;
    }
}

function clearElement (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}
