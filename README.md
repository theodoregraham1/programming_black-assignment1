# API

## Index

### GET `/`

Index, provides the base HTML page

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

## Editing Entries

### DELETE `/delete/:type/:id`

#### Parameters

- `type` - Either "taxon" or "bird": the type of entity being deleted
- `id` - An integer which is the ID of the entity being deleted

#### Returns

Only returns data on error

### PUT `/edit/:type/`

#### Parameters

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

## Getters

### GET `/get/entity/:type/:id`

