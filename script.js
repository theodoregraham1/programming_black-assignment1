"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nav-index-btn").addEventListener("click", loadIndex);
    document.getElementById("nav-browse-btn").addEventListener("click", loadBrowse);
    document.getElementById("nav-add-btn").addEventListener("click", loadAdd)

    loadAdd();
})

const TAXONOMY_ORDER = ["Species", "Genus", "Family", "Order"];
const ORDER_NAME = "Aves";

function loadIndex() {
    let bod = document.getElementById("main-container")
    clearElement(bod)

    let h2 = document.createElement("h2");
    h2.classList.add("mb-3", "text-center");
    h2.appendChild(document.createTextNode("Home"));
    bod.appendChild(h2);

    let row = document.createElement("div");
    row.className = "row";

    for (let i=0;i<3;i++) {
        // TODO: temp
        // FIXME: these go too large when they become multirow
        let bird_id = i

        let col = document.createElement("div");
        col.classList.add("col-lg-auto", "mb-3");

        let card = document.createElement("div");
        card.className = "card";
        col.appendChild(card);

        let img = document.createElement("img");
        img.alt = "Image of a bird"; // do
        img.src = "data:image/jpeg;base64,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"
        img.className = "card-img-top";
        card.appendChild(img);

        let card_bod = document.createElement("div");
        card_bod.className = "card-body";
        card.appendChild(card_bod);

        let card_title = document.createElement("h4");
        card_title.className = "card-title";
        card_title.appendChild(document.createTextNode("Card title"));
        card_bod.appendChild(card_title);

        let card_text = document.createElement("p");
        card_text.className = "card-text";
        card_text.appendChild(document.createTextNode("lorem ipsum lorem orca kasfh ahfjaf"));
        card_bod.appendChild(card_text);

        let card_btn = document.createElement("button");
        card_btn.classList.add("btn", "btn-primary");
        card_btn.id = `card-${bird_id}-btn`;
        card_btn.appendChild(document.createTextNode("Read more"));
        card_bod.appendChild(card_btn);

        card_btn.addEventListener("click", loadBird(bird_id))

        row.appendChild(col)
    }
    bod.appendChild(row);

    // TODO: Dynamic cards, and reflect this in links with listeners
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
    h3.appendChild(document.createTextNode("Aves"));
    bod.appendChild(h3);

    createBrowseLevel(3, "browse-accordion", bod);
}

function createBrowseLevel (level, parent_id, parent) {
    let level_list = document.createElement("div");
    level_list.classList.add("accordion","accordion-flush");
    level_list.id = `${parent_id}-list`;

    // level_list.hidden = true
    parent.appendChild(level_list)

    // TODO: fetch level data from back-end
    for (let i=0; i<5; i++) {
        let item_id = `${parent_id}-${i}`;
        let item = createAccordionItem(item_id, item_id, level_list.id)

        level_list.appendChild(item);
        let item_bod = document.getElementById(`${item_id}-body`);
        item_bod.appendChild(document.createTextNode("lorem ipsum lorem ipsum lorem lorem lorem"));
        if (level > 0) {
            createBrowseLevel(level - 1, item_id, item_bod);
        }
        /*
        // Set-up for loading when it is clicked
        document.getElementById(`${item_id}-opener`).addEventListener("click", () => {

            if (!document.getElementById(`${item_id}-list`)) {
                // Use forEach later
                if (level > 0) {
                } else {
                    // something else, to link to individual species
                }
            }
        })
         */
    }

    return level_list
}

function loadAdd () {
    let bod = document.getElementById("main-container");
    clearElement(bod);

    let h2 = document.createElement("h2");
    h2.classList.add("mb-3", "text-center");
    h2.appendChild(document.createTextNode("Add"));
    bod.appendChild(h2);

    // Setup breadcrumb
    let breadcrumb = document.createElement("nav");
    breadcrumb.ariaLabel = "breadcrumb";
    bod.appendChild(breadcrumb);

    let bread_ol = document.createElement("ol");
    bread_ol.id = "breadcrumb-ol"
    bread_ol.className = "breadcrumb";
    breadcrumb.append(bread_ol);

    let order_item = document.createElement("li");
    order_item.className = "breadcrumb-item";
    order_item.appendChild(document.createTextNode(ORDER_NAME))
    bread_ol.appendChild(order_item);

    // Setup dropdown
    let bread_dropdown = document.createElement("div");
    bread_dropdown.className = "dropdown";
    bread_dropdown.id = "breadcrumb-dropdown"

    createBreadcrumbDropdownInner(ORDER_NAME, 2, bread_dropdown);

    let drop_item = document.createElement("li");
    drop_item.id = "breadcrumb-dropdown-li"
    drop_item.className = "breadcrumb-item";
    drop_item.style.width = Math.ceil(bread_dropdown.clientWidth * 1.2);
    drop_item.appendChild(bread_dropdown);
    bread_ol.appendChild(drop_item);

    // Create taxon creator

    /*
    TODO: On mobile this should be vertically orientated, but it may be more effective if it has side to side stuff on desktop
    like species can have their photo input off to the side
     */
    let form_div = document.createElement("div");
    form_div.className = "row";
    bod.appendChild(form_div);

    let form = document.createElement("form");
    form_div.appendChild(form);

    let title_div = document.createElement("div");
    title_div.classList.add("col-3", "mb-3")
    form.append(title_div)

    let title_input = document.createElement("input");
    title_input.classList.add("form-control", "col-3");
    title_div.appendChild(title_input);

    let description_div = document.createElement("div");
    description_div.classList.add("col-3", "mb-3")
    form.appendChild(description_div)

    let description_input = document.createElement("textarea")
    description_input.classList.add("form-control", "col-3")
    description_div.appendChild(description_input)
}

function update_breadcrumb (choice, level) {
    let dropdown_container = document.getElementById("breadcrumb-dropdown-li");

    let bread_item = document.createElement("li");
    bread_item.className = "breadcrumb-item";
    bread_item.appendChild(document.createTextNode(choice));

    dropdown_container.insertAdjacentElement("beforebegin", bread_item);

    if (level >= 0) {
        // Reset dropdown
        clearElement(dropdown_container);
        createBreadcrumbDropdownInner(choice, level, dropdown_container);

        // Edit taxon creator

    } else {
        dropdown_container.hidden = true;
    }
}

function loadSearch (query) {

}

function loadBird (birdId) {

}

function loadTaxon (taxonId) {

}

function clearElement (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

function createAccordionItem (item_id, title_text, parent_id) {
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
    opener.appendChild(document.createTextNode(title_text));
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

    acc_collapse.appendChild(acc_body);
    new_li.appendChild(acc_collapse);

    return new_li
}

function createBreadcrumbDropdownInner (parent, level, container) {
    // TODO: Fetch parent children
    let choices = [0,1,2,3,4,5,6];

    let btn = document.createElement("span");
    btn.classList.add("dropdown-toggle", "badge", "bg-primary");
    btn.ariaExpanded = "false";
    btn.type = "button";
    btn.setAttribute("data-bs-toggle", "dropdown");
    btn.appendChild(document.createTextNode("Select " +TAXONOMY_ORDER[level]));
    container.appendChild(btn);

    let options = document.createElement("ul");
    options.className = "dropdown-menu";
    container.appendChild(options);

    for (let i=0; i < choices.length; i++) {
        let li = document.createElement("li");
        li.id = `breadcrumb-dropdown-option-${i}`
        li.className = "dropdown-item";
        li.appendChild(document.createTextNode(choices[i]));
        options.appendChild(li)

        li.addEventListener("click", () => update_breadcrumb(choices[i], level-1));
    }
}