# API

---

## Index

### GET `/`

Index, provides the base HTML page.

#### Returns

A HTML file ("index.html")

---

## Adding Entries

### POST `/add/species/`

Adds a new species of bird to the table of birds. Returns the created entry.

#### Request Body

- `name` : `String` - the common (English) name of the bird.
- `species` : `String` - the "specific epithet" of the bird: the Latin name of the species.
- `genus` : `number` - the ID number of the taxon which is the genus containing the species. It must have a `level` of 1.
- `description` : `String` - the body text of the entry which describes the bird.
- `picture` : `String`, _optional_ - a URL linking to an image of the bird.

#### Returns

Normally, returns an `object` containing the bird's data. It should be identical to the inputs with an additional ID field. 

During errors, can return plain text or a JSON representation of the error

---

### POST `/add/level/`

Adds a new taxon to the table of taxa. Returns the created entry.

#### Request Body

- `name` : `String` - the Latin scientific name of the taxon.
- `father` : `number` - the ID of the taxon which is the parent to this taxon. It must have a `level` 1 higher than this taxon's `level`.
- `description` : `String` - the body text of the entry which describes the taxon.
- `level` : `number` - the level of the taxon: between 1 (genus) and 3 (order) inclusive (since classes or above cannot be added).

#### Returns

Normally, returns an `object` containing the taxon's data.

During errors, returns plain text or JSON error data.

---

## Editing Entries

### DELETE `/delete/:type/:id`

Deletes an entry from one of the data tables.

#### URL Parameters

- `type` - either "taxon" or "bird": the type of entity being deleted
- `id` - an integer which is the ID of the entity being deleted

#### Returns

Only returns data on error

---

### PUT `/edit/:type/`

Updates the data in an entry from one of the data tables.

#### URL Parameters

- `type` - Either "taxon" or "bird": the type of entity being edited

#### Request Body

- `id` : `number` - the ID of the entity being edited.

When `type` = "taxon":

- `name`: `String`, _optional_  - the new name for the taxon.
- `description` : `String`, _optional_ - the new description for the taxon.
- `father` : `number`, _optional_ - the new parent of the taxon, must still be of a valid level.

When `type` = "bird":

- `name` : `String`, _optional_ - the new name for the bird.
- `description` : `String`, _optional_ - the new description for the bird.
- `genus` : `number`, _optional_ - the new genus containing the bird, must still be of `level` 1
- `species` : `String`, _optional_ - the new specific epithet of the bird.

#### Returns

Returns an `object` of the updated entry.

---

## Getters

### GET `/get/entity/:type/:id`

Retrieves a specific entry from the data tables, selected by its ID.

#### URL Parameters

- `type` - either "taxon" or "bird", the type of entity being accessed
- `id` - the ID of the entity being accessed

#### Returns

Returns an `object` of the matching entry or throws an error if either `type` is not valid or an entity with a matching `id` does not exist.

---

### GET `/get/birds/random/:n`

Retrieves a chosen number of random distinct birds from the data table

#### URL Parameters

- `n` - The number of birds to be queried 

#### Returns

Returns an `object` array with `n` items if there are at least `n` birds in the bird table. They will all be different birds.

If there are less than `n` birds in the table, all birds in the table will be returned.

---

### GET `/get/children/:father`

Retrieves all the children of a parent taxon from a data table as selected by the level of the parent (e.g. if the parent 
is a genus, all the birds in that genus will be returned, or if the parent is an order, the returned objects will be taxa 
with a `level` of 2 - families).

#### URL Parameters

- `father` - the ID of the taxon which is the parent being accessed

#### Returns

Returns an `object` array.

If the `level` of the parent is `1`, every bird in that genus is returned, else every child taxon of this parent is returned.

---

### GET `get/level/:level`

Retrieves all taxa of a given level. 

#### URL Parameters

- `level` - an integer from 1 to 5 inclusive which designates the taxonomical level to be queried.

#### Returns

An `object` array containing every item in the table of taxa which has a matching level.

---

### GET `list/:type`

Retrieves all data from a table

#### URL Parameters

- `type` - either "taxon" or "bird", the type of entity to retrieve 

#### Returns 

Returns all the data for every bird or every taxon respectively

Returns an error if `type` does not match one of the two tables.