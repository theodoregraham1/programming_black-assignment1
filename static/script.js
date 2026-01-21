"use strict";
// TODO: Add aria-labels etc to everything to make accessible (also alt text)

const TAXONOMY_ORDER = ["Species", "Genus", "Family", "Order", "Class"];
const TAXONOMY_ORDER_PLURALS = ["Species", "Genera", "Families", "Orders", "Classes"]
let CLASS;

document.addEventListener("DOMContentLoaded", async function () {
    CLASS = await getTaxon(0);
    document.getElementById("nav-index-btn").addEventListener("click", loadIndex);
    document.getElementById("nav-browse-btn").addEventListener("click", loadBrowse);
    document.getElementById("nav-add-btn").addEventListener("click", loadAdd);

    await loadIndex();
})

async function loadIndex() {
    let bod = document.getElementById("main-container")
    clearElement(bod)

    bod.append(createHeader("Birdipedia"))

    // TODO
    const NUMBER_OF_CARDS = 3;
    let row = document.createElement("div");
    row.className = "d-flex flex-row align-items-stretch";

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
    col.classList.add("col-lg-auto", "mb-3", "me-3", "d-flex");

    let card = document.createElement("div");
    card.className = "card";
    //card.style.minHeight = "100%";
    card.style.maxWidth = "300px";
    col.appendChild(card);

    let img_div = document.createElement("div");
    card.appendChild(img_div)

    let img = document.createElement("img");
    img.alt = "..."; // todo
    img.className = "card-img-top";
    img_div.appendChild(img);

    let card_bod = document.createElement("div");
    card_bod.className = "card-body d-flex flex-column";
    card.appendChild(card_bod);

    let card_title = document.createElement("h4");
    card_title.className = "card-title";
    card_bod.appendChild(card_title);

    let card_text = document.createElement("p");
    card_text.className = "card-text";
    card_bod.appendChild(card_text);

    let card_btn = document.createElement("button");
    card_btn.classList.add("btn", "btn-primary", "mt-auto");
    card_btn.appendChild(document.createTextNode("Read more"));
    card_bod.appendChild(card_btn);

    try {
        let {id, name, description, picture} = data;

        if (picture) {
            img.src = picture;
        } else {
            img_div.hidden = true;
            img_div.ariaHidden = "hide";
        }

        card_title.appendChild(document.createTextNode(name));

        card_text.appendChild(document.createTextNode(cutDescription(description)));
        card_btn.id = `card-${id}-btn`;
        card_btn.addEventListener("click", () => loadBird(data))

    } catch (e) {

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
    let bod = document.getElementById("main-container");
    clearElement(bod);

    // Headers
    bod.appendChild(createHeader("Browse entries"));

    let h3 = document.createElement("h3");
    h3.className = "mb-3";
    h3.appendChild(document.createTextNode(CLASS.name));
    bod.appendChild(h3);
    // todo AVES info

    createBrowseLevel(CLASS, "0");
}

async function createBrowseLevel (father, parent_level_id) {
    let level_list = document.createElement("div");
    level_list.classList.add("accordion","accordion-flush", "border",);

    if (father.level !== TAXONOMY_ORDER.length-1) {
        level_list.classList.add("border-bottom-0", "border-right-0")
    }

    let container;
    if (parent_level_id !== "0") {
        container = document.getElementById(`${parent_level_id}-body`)
    } else {
        container = document.getElementById("main-container");
    }
    container.appendChild(level_list);

    level_list.id = `${parent_level_id}-list`;

    let new_level = father.level-1;
    try {
        let children = await getChildren(father.id);

        for (const child of children) {
            let {id, name} = child;

            // Load children
            let item_id = `${parent_level_id}-${id}`;
            let item = createAccordionItem(item_id, child, level_list.id)

            level_list.appendChild(item);

            let btn = document.createElement("button");
            btn.appendChild(document.createTextNode(`View ${TAXONOMY_ORDER[new_level].toLowerCase()}`))
            btn.classList.add("btn", "btn-sm", "btn-outline-primary", "mb-3")
            document.getElementById(`${item_id}-body`).appendChild(btn);

            // Put text in header
            let opener = document.getElementById(`${item_id}-opener`);
            let p = document.createElement("span");
            p.classList.add("fw-semibold");
            opener.appendChild(p);

            if (new_level > 0) {
                p.appendChild(document.createTextNode(name));

                // If the level of the next item is a taxon, load its children when it is opened
                opener.addEventListener("click", () => {
                    createBrowseLevel(child, item_id)
                }, {once: true}); // Children only ever need to be loaded once

                btn.addEventListener("click", () => loadTaxon(child));

            } else {
                // Title with scientific name as well
                let {species} = child;

                p.appendChild(document.createTextNode(`${name} - (`));
                p.appendChild(getItalicSpan(`${father.name} ${species}`));
                p.appendChild(document.createTextNode(")"));

                btn.addEventListener("click", () => loadBird(child));
            }
        }
    } catch (e) {
        alert(e);
    }
}

function createAccordionItem (item_id, item, parent_id) {
    // Create element
    let new_li = document.createElement("div");
    new_li.className = "accordion-item";
    new_li.id = `${item_id}-container`

    // Create title section
    let title = document.createElement("p");
    title.className = "accordion-header";
    new_li.appendChild(title)

    let opener = document.createElement("button");
    opener.classList.add("accordion-button", "collapsed");
    opener.id = `${item_id}-opener`
    opener.type = "button";
    opener.setAttribute("data-bs-toggle", "collapse");
    opener.setAttribute("data-bs-target", `#${item_id}`);
    opener.ariaExpanded = "false";
    opener.setAttribute("aria-controls", item_id);
    // Note: name text added in createBrowseLevel function, since the format of this differs between levels

    title.appendChild(opener)

    // Create body section
    let acc_collapse = document.createElement("div");
    acc_collapse.id = item_id;
    acc_collapse.classList.add("accordion-collapse", "collapse");
    acc_collapse.setAttribute("data-bs-father", `#${parent_id}`);

    let acc_body = document.createElement("div");
    acc_body.classList.add("accordion-body", "pb-0", "pe-0", "border-bottom", "border-3");
    acc_body.id = `${item_id}-body`

    let p = document.createElement("p");
    p.classList.add("me-3")
    p.appendChild(document.createTextNode(cutDescription(item.description)));
    acc_body.appendChild(p);

    acc_collapse.appendChild(acc_body);
    new_li.appendChild(acc_collapse);

    return new_li
}

function loadAdd() {
    let bod = document.getElementById("main-container");
    clearElement(bod);

    bod.appendChild(createHeader("Add new entry"));

    // Setup breadcrumb
    let breadcrumb = document.createElement("nav");
    breadcrumb.classList.add("mx-auto", "col-md-6");
    breadcrumb.ariaLabel = "breadcrumb";
    bod.appendChild(breadcrumb);

    let bread_ol = document.createElement("ol");
    bread_ol.id = "breadcrumb-ol"
    bread_ol.className = "breadcrumb";
    breadcrumb.append(bread_ol);

    // Setup dropdown
    let bread_dropdown = document.createElement("div");
    bread_dropdown.className = "dropdown";
    bread_dropdown.id = "breadcrumb-dropdown";

    let drop_item = document.createElement("li");
    drop_item.id = "breadcrumb-dropdown-li"
    drop_item.className = "breadcrumb-item";
    drop_item.style.width = Math.ceil(bread_dropdown.clientWidth * 1.2).toString();
    drop_item.appendChild(bread_dropdown);
    bread_ol.appendChild(drop_item);

    // Begin the dropdown with the class
    updateBreadcrumb(CLASS, drop_item);

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

    let name_div = document.createElement("div");
    name_div.classList.add("mb-3", "mx-auto")
    inputs_div.append(name_div)

    let name_input = document.createElement("input");
    name_input.classList.add("form-control");
    name_input.id = "add-form-name";
    name_input.name = "name";
    name_input.type = "text";
    name_input.required = true;
    name_div.appendChild(name_input);

    let description_div = document.createElement("div");
    description_div.classList.add("mb-3", "mx-auto");
    inputs_div.appendChild(description_div);

    let description_input = document.createElement("textarea")
    description_input.classList.add("form-control")
    description_input.id = "add-form-description"
    description_input.name = "description";
    description_input.rows = 5;
    description_input.required = true;
    description_div.appendChild(description_input);

    return form;
}

function loadBirdCreator(genus) {
    // TODO: Make look good on mobile

    // Create bird creator form
    let form = loadGeneralCreator();
    let inputs_div = document.getElementById("add-form-inputs");
    inputs_div.classList.add("ms-auto");

    document.getElementById("add-form-description")
        .placeholder = "Description of bird";

    // Make common name and species inputs into a group so they appear side-by-side
    let name_input = document.getElementById("add-form-name");
    name_input.placeholder = "Common name";

    // Add species input
    let species_input = document.createElement("input");
    species_input.classList.add("form-control");
    species_input.id = "add-form-species";
    species_input.name = "species";
    species_input.type = "text";
    species_input.required = true;
    species_input.placeholder = "Specific epithet";
    name_input.insertAdjacentElement("afterend", species_input);
    name_input.parentElement.classList.add("input-group");

    // Picture input element
    let picture_div = document.createElement("div");
    picture_div.classList.add("mb-3", "mx-auto");
    inputs_div.appendChild(picture_div);

    let picture_input = document.createElement("input");
    picture_input.classList.add("form-control");
    picture_input.type = "url";
    picture_input.placeholder = "Picture URL"
    picture_input.name = "picture";
    picture_div.appendChild(picture_input);

    let submit_button = document.createElement("button");
    submit_button.classList.add("btn", "btn-success", "mb-5");
    submit_button.appendChild(document.createTextNode("Add new bird"));
    inputs_div.appendChild(submit_button);

    // Give picture preview
    let preview_div = document.createElement("div");
    preview_div.classList.add("col-md-6", "me-auto", "border");
    preview_div.style.minHeight = "50px";
    form.appendChild(preview_div);

    let preview_label = document.createElement("h5");
    preview_label.classList.add("mx-auto", "pt-3");
    preview_label.appendChild(document.createTextNode("Picture preview"));
    preview_div.appendChild(preview_label);

    let picture_preview = document.createElement("img");
    picture_preview.classList.add("p-3", "mx-auto", "object-fit-contain");
    picture_preview.style.maxWidth = "100%";
    picture_preview.alt = "Preview of the bird's image which you have uploaded";

    picture_preview.hidden = true;
    picture_preview.ariaHidden = "hidden";
    preview_div.appendChild(picture_preview);

    picture_input.addEventListener("input", () => {
        picture_preview.src = picture_input.value;

        if (picture_input.value) {
            picture_preview.hidden = false;
            picture_preview.ariaHidden = "show";
        } else {
            picture_preview.hidden = true;
            picture_preview.ariaHidden = "hidden";
        }
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
                    'Accept': 'application/json, text/plain',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            let content = await response.json();
            await loadBird(content);
        } catch (e) {
            alert(e);
        }
    })

}

function loadTaxonCreator(father) {
    // Load creator for a new taxon
    let form = loadGeneralCreator();
    let inputs_div = document.getElementById("add-form-inputs");
    inputs_div.classList.add("mx-auto");

    document.getElementById("add-form-description")
        .placeholder = `Description of ${TAXONOMY_ORDER[father.level-1].toLowerCase()}`;

    document.getElementById("add-form-name")
        .placeholder = "Scientific name";

    let submit_button = document.createElement("button");
    submit_button.classList.add("btn", "btn-success");
    submit_button.appendChild(document.createTextNode(`Add new ${TAXONOMY_ORDER[father.level-1].toLowerCase()}`))
    inputs_div.appendChild(submit_button);

    // Submitter for form
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            let data = new FormData(form);
            data = Object.fromEntries(data.entries());
            data.father = father.id;
            data.level = father.level-1;

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
            let dropdown_container = document.getElementById("breadcrumb-dropdown-li");
            dropdown_container.hidden = false;
            dropdown_container.ariaHidden = "show";
            await updateBreadcrumb(content, dropdown_container);
        } catch (e) {
            alert(e);
        }
    })
}

function updateBreadcrumb (choice, dropdown_container) {

    let bread_item = document.createElement("li");
    bread_item.className = "breadcrumb-item";
    let a = document.createElement("a");
    a.appendChild(document.createTextNode(choice.name));
    a.href = "#";
    bread_item.appendChild(a);

    a.addEventListener("click", (event) => {
        // When the name is clicked in the breadcrumb, go back to that stage in taxonomy selection
        event.preventDefault();

        while (bread_item.nextElementSibling !== dropdown_container) {
            bread_item.nextElementSibling.remove();
        }
        createBreadcrumbDropdownInner(choice, dropdown_container)

        // In case creator has been selected already
        loadAddPlaceholder();
        dropdown_container.hidden = false;
        dropdown_container.ariaHidden = "show";
    })

    dropdown_container.insertAdjacentElement("beforebegin", bread_item);

    if (choice.level >= 2) {
        // Reset dropdown
        createBreadcrumbDropdownInner(choice, dropdown_container);
    } else {
        dropdown_container.hidden = true;
        loadBirdCreator(choice)
    }
}

// TODO: Make entries editable as stretch
async function loadBird(bird) {
    let bod = document.getElementById("main-container");
    clearElement(bod);

    let genus = await getTaxon(bird.genus);

    // Create nicer header
    let h2_div = document.createElement("div");
    h2_div.classList.add("border-bottom", "col-md-6", "mx-auto", "my-3");
    bod.appendChild(h2_div);

    let h2 = document.createElement("h2");
    h2.classList.add("text-center");
    h2.appendChild(document.createTextNode(bird.name));

    let small_text = document.createElement("p");
    small_text.classList.add("fw-light", "fst-italic", "text-center", "hover-link");
    small_text.appendChild(document.createTextNode(`${genus.name} ${bird.species}`))
    h2_div.append(
        h2,
        small_text
    );

    if (bird.picture) {
        // column
        let img_col = document.createElement("div");
        img_col.classList.add("col-md-6", "mx-auto", "text-center", "pb-3");
        bod.appendChild(img_col);

        // image
        let img = document.createElement("img");
        img.classList.add("mx-auto", "object-fit-contain", "border", "border-dark");
        img.src = bird.picture;
        img_col.appendChild(img);
        // todo source and alt

        img.style.maxWidth = "50%";
        img.style.maxHeight = "70%";
    }

    // column
    let col = document.createElement("div");
    col.classList.add("col-md-6", "mx-auto");
    bod.appendChild(col);

    // description
    let desc_p = document.createElement("p");
    desc_p.appendChild(document.createTextNode(bird.description));
    col.appendChild(desc_p);

    // other birds in this genus
    let genus_div = document.createElement("div");
    col.appendChild(genus_div);

    let genus_title = document.createElement("h4");
    genus_title.classList.add("my-3");
    genus_title.append(
        document.createTextNode("Other birds in the "),
        getItalicSpan(genus.name),
        document.createTextNode(" genus:")
    );
    genus_div.appendChild(genus_title);

    try {
        let other_birds = await getChildren(genus.id);

        createListGroup(genus, other_birds, genus_div);

        let selected = document.getElementById(`list-group-${genus.id}-item-${bird.id}`);
        selected.classList.add("active");
        selected.ariaCurrent = "true";

    } catch (e) {
        alert(e);
    }

    let genus_button = document.createElement("button");
    genus_button.classList.add("btn", "btn-outline-secondary");
    genus_button.addEventListener("click", () => {
        loadTaxon(genus);
    });
    genus_button.append(
        document.createTextNode("View "),
        getItalicSpan(genus.name),
        document.createTextNode(" genus")
        );
    genus_div.appendChild(genus_button);

    // buttons
    let buttons_div = document.createElement("div");
    buttons_div.classList.add("d-flex", "flex-row", "mt-5", "pt-3", "border-top");
    col.appendChild(buttons_div);

    // delete button
    buttons_div.appendChild(createDeleteButton(bird, genus, "bird"));
}

async function loadTaxon(taxon) {
    let bod = document.getElementById("main-container");
    clearElement(bod);

    bod.appendChild(createHeader(taxon.name));

    // column
    let col = document.createElement("div");
    col.classList.add("col-md-6", "mx-auto");
    bod.appendChild(col);

    // description
    let desc_h4 = document.createElement("h4");
    desc_h4.appendChild(document.createTextNode("Description:"))
    desc_h4.classList.add("mt-3");
    col.appendChild(desc_h4);

    let desc_p = document.createElement("p");
    desc_p.appendChild(document.createTextNode(taxon.description));
    col.appendChild(desc_p);

    // children of this taxon
    let children_div = document.createElement("div");
    col.appendChild(children_div);

    let children_title = document.createElement("h4");
    children_title.classList.add("mt-3");
    children_title.append(
        document.createTextNode(`${TAXONOMY_ORDER_PLURALS[taxon.level-1]} in `),
        getItalicSpan(taxon.name),
        document.createTextNode(":")
    );
    children_div.appendChild(children_title);

    try {
        let children = await getChildren(taxon.id);

        createListGroup(taxon, children, children_div);
    } catch (e) {
        alert(e);
    }

    // parts of the page for taxa that are not Aves
    let father;
    if (taxon.level !== TAXONOMY_ORDER.length-1) {
        // siblings of the taxon
        let siblings_div = document.createElement("div");
        col.appendChild(siblings_div);

        father = await getTaxon(taxon.father);

        let siblings_title = document.createElement("h4");
        siblings_title.classList.add("mt-3");
        siblings_title.append(
            document.createTextNode(`Other ${TAXONOMY_ORDER_PLURALS[taxon.level].toLowerCase()} in the `),
            getItalicSpan(father.name),
            document.createTextNode(` ${TAXONOMY_ORDER[father.level].toLowerCase()}:`)
        );
        siblings_div.appendChild(siblings_title);

        try {
            let siblings = await getChildren(father.id);

            createListGroup(father, siblings, siblings_div);

            let selected = document.getElementById(`list-group-${father.id}-item-${taxon.id}`);
            selected.classList.add("active");
            selected.ariaCurrent = "true";
        } catch (e) {
            alert(e);
        }

        let parent_button = document.createElement("button");
        parent_button.classList.add("btn", "btn-outline-secondary");
        parent_button.addEventListener("click", () => {
            loadTaxon(father);
        });
        parent_button.append(
            document.createTextNode("View "),
            getItalicSpan(father.name),
            document.createTextNode(` ${TAXONOMY_ORDER[father.level].toLowerCase()}`)
        );
        siblings_div.appendChild(parent_button);
    }

    // buttons
    let buttons_div = document.createElement("div");
    buttons_div.classList.add("d-flex", "flex-row", "mt-4", "pt-3", "border-top", "col-md-6", "mx-auto");
    bod.appendChild(buttons_div);

    if (taxon.level !== TAXONOMY_ORDER.length-1) {
        buttons_div.appendChild(createDeleteButton(taxon, father, "taxon"));
    }

    let edit_button = createEditButton(() => {loadTaxon(taxon)});
    buttons_div.appendChild(edit_button);

    edit_button.addEventListener("click", () => {loadTaxonEdit(col, buttons_div, taxon, father)});
}

async function loadTaxonEdit(container, buttons_div, taxon, father) {
        clearElement(container);

        let form = document.createElement("form");
        container.appendChild(form);

        // name
        let name_div = document.createElement("div");
        name_div.classList.add("col-md-6", "mb-3")
        form.appendChild(name_div);

        let name_input = document.createElement("input");
        name_input.classList.add("form-control");
        name_input.name = "name";
        name_input.id = "input-name";
        name_input.value = taxon.name;

        let name_label = document.createElement("h4");
        name_label.classList.add("h4");
        name_label.htmlFor = name_input.id;
        name_label.appendChild(document.createTextNode("Name"));

        name_div.append(name_label, name_input);

        // description
        let desc_div = document.createElement("div");
        desc_div.classList.add("mb-3");
        form.appendChild(desc_div);

        let desc_input = document.createElement("textarea");
        desc_input.classList.add("form-control");
        desc_input.name = "description";
        desc_input.id = "input-description";
        desc_input.appendChild(document.createTextNode(taxon.description));

        let desc_label = document.createElement("label");
        desc_label.classList.add("h4");
        desc_label.htmlFor = desc_input.id;
        desc_label.appendChild(document.createTextNode("Description"))

        desc_div.append(desc_label, desc_input);

        if (taxon.level < TAXONOMY_ORDER.length-2) {
            // father
            let parent_div = document.createElement("div");
            parent_div.classList.add("col-md-6", "my-3");
            form.appendChild(parent_div);

            let parent_input = document.createElement("select");
            parent_input.classList.add("form-select");
            parent_input.name = "father";

            let uncles;
            try {
                let response = await fetch(`get/level/${father.level}`);
                if (!response.ok) {
                    uncles = [father];
                } else {
                    uncles = await response.json();
                }
            } catch (e) {
                alert(e);
                uncles = [father];
            }

            for (const uncle of uncles) {
                let option = document.createElement("option");

                option.value = uncle.id;
                option.appendChild(document.createTextNode(uncle.name));

                if (uncle.id === father.id) {
                    option.selected = true;
                }

                parent_input.appendChild(option);
            }

            let parent_label = document.createElement("label");
            parent_label.classList.add("h4");
            parent_label.htmlFor = parent_input.id;
            parent_label.appendChild(document.createTextNode(`${TAXONOMY_ORDER[father.level]}`));

            desc_div.append(parent_label, parent_input);
        }

        let submit_button = document.createElement("button");
        submit_button.classList.add("btn", "btn-outline-success");
        submit_button.appendChild(document.createTextNode("Submit edit"))
        buttons_div.appendChild(submit_button);

        submit_button.addEventListener("click", async function () {
            try {
                let data = new FormData(form);
                data = Object.fromEntries(data.entries());

                data.id = taxon.id;
                data.father = parseInt(data.father);

                let response = await fetch("/edit/taxon", {
                    method: "PUT",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify(data),
                });
                if (response.ok) {
                    let content = await response.json();

                    await loadTaxon(content);
                } else {
                    alert("Error: Problem in request, please try again later");
                    loadTaxon(taxon);
                }
            } catch (e) {
                alert(e);
            }
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
        });
}

function createDeleteButton(entry, father, type) {
    // delete button
    let delete_button = document.createElement("button");
    delete_button.classList.add("btn", "btn-danger", "me-3")
    delete_button.appendChild(document.createTextNode("Delete entry"));

    delete_button.addEventListener("click", () => {
        // Delete confirmation
        delete_button.classList.remove("btn-danger");
        delete_button.classList.add("btn-secondary");
        delete_button.firstChild.remove();
        delete_button.appendChild(document.createTextNode("Confirm deletion"));

        delete_button.addEventListener("click", () => {
            fetch(`delete/${type}/${entry.id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Error: deletion unsuccessful")
                    } else {
                        loadTaxon(father);
                    }
                })
                .catch((e) => {
                    alert(e);
                });
        })
    });

    return delete_button;
}

function createEditButton(backFunction) {
    let edit_button = document.createElement("button");
    edit_button.classList.add("btn", "btn-secondary", "me-3");
    edit_button.appendChild(document.createTextNode("Edit entry"));

    edit_button.addEventListener("click", () => {
        // reset button
        edit_button.firstChild.remove();
        edit_button.appendChild(document.createTextNode("Cancel edit"));
        edit_button.classList.remove("btn-secondary");
        edit_button.classList.add("btn-outline-primary");

        edit_button.addEventListener("click", backFunction);
    });

    return edit_button
}

async function createBreadcrumbDropdownInner (father, container) {
    clearElement(container);

    let btn = document.createElement("span");
    btn.classList.add("dropdown-toggle", "badge", "bg-primary");
    btn.ariaExpanded = "false";
    btn.type = "button";
    btn.setAttribute("data-bs-toggle", "dropdown");
    btn.appendChild(document.createTextNode("Select " + TAXONOMY_ORDER[father.level-1]));
    container.appendChild(btn);

    let options = document.createElement("ul");
    options.className = "dropdown-menu";
    container.appendChild(options);

    try {
        let choices = await getChildren(father.id);

        for (let i = 0; i < choices.length; i++) {
            let li = document.createElement("li");
            li.id = `breadcrumb-dropdown-option-${father.level-1}-${i}`
            li.className = "dropdown-item";
            li.appendChild(document.createTextNode(choices[i].name));
            options.appendChild(li)

            li.addEventListener("click", () => {
                updateBreadcrumb(choices[i], container)
            });
        }
    } catch (e) {
        alert(e);
        clearElement(options);
    }

    let new_li = document.createElement("li");
    new_li.id = `breadcrumb-dropdown-${father.level-1}-new`
    new_li.className = "dropdown-item";
    new_li.appendChild(document.createTextNode(`Create new ${TAXONOMY_ORDER[father.level-1]}`));
    options.appendChild(new_li)

    new_li.addEventListener("click", () => {
        loadTaxonCreator(father);
        container.hidden = true;
    })
}

async function getTaxon(id) {
    let response = await fetch(`get/entity/taxon/${id}`)

    if (!response.ok) {
        throw new Error(`${response.status}: response failed`);
    }

    return await response.json();
}

async function getChildren(id) {
    let response = await fetch(`get/children/${id}`);

    if (!response.ok) {
        throw new Error(`${response.status}: response failed`);
    }

    return await response.json();
}

function createListGroup(father, children, container) {
        if (children.length !== 0) {
            let list_div = document.createElement("div");
            list_div.classList.add("list-group", "ms-2", "mb-3", "col-md-6");
            container.appendChild(list_div);

            for (const child of children) {
                let a = document.createElement("a");
                a.classList.add("list-group-item", "list-group-item-action");
                a.href = "#";
                a.id = `list-group-${father.id}-item-${child.id}`;
                list_div.appendChild(a);

                if (father.level === 1) {
                    a.appendChild(createBothNamesTitle(child, father));
                    a.addEventListener("click", () => {
                        loadBird(child);
                    });
                } else {
                    let title = document.createElement("p");
                    title.classList.add("p-0", "m-0", "fw-semibold")
                    title.appendChild(document.createTextNode(child.name));
                    a.appendChild(title);

                    a.addEventListener("click", () => {
                        loadTaxon(child);
                    });
                }
            }
        } else {
            let p = document.createElement("p");
            p.appendChild(document.createTextNode(
                `There are no entries in this ${TAXONOMY_ORDER[father.level].toLowerCase()}`
            ));
            container.appendChild(p);
        }
}

function createHeader(title) {
    let h2 = document.createElement("h2");
    h2.classList.add("border-bottom", "col-md-6", "text-center", "my-3", "pb-2", "mx-auto");
    h2.appendChild(document.createTextNode(title));
    return h2;
}

function clearElement (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

function cutDescription(description) {
    // Cut an item's description to fit nicely in small displays
    if (description.length > 200) {
        description = description.slice(0,200) + "...";
    }
    return description;
}

function getItalicSpan(text) {
    let span = document.createElement("span");
    span.className = "fst-italic";
    span.appendChild(document.createTextNode(text))
    return span;
}

function createBothNamesTitle(bird, genus) {
    let div = document.createElement("div");

    let title = document.createElement("p");
    title.classList.add("p-0", "m-0", "fw-semibold")
    title.appendChild(document.createTextNode(bird.name));
    div.appendChild(title);

    let scientific = document.createElement("small");
    scientific.appendChild(getItalicSpan(`${genus.name} ${bird.species}`));
    div.appendChild(scientific);

    return div;
}