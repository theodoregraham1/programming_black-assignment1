# API

## Index

### GET `/`

Index, provides the base HTML page

## Adding Entries

### POST `/add/species/`

Adds a new species of bird to the table of birds. Returns the created entry.

#### Request Body

- `name` : `String` - the common (English) name of the bird
- `species` : `String` - the "specific epithet" of the bird: the Latin name of the species
- `genus` : `number` - the ID number of the taxon which is the genus containing the species. It must have a `level` of 1.
- `description` : `String` - the body text of the entry which describes the bird
- `picture` : `String`, _optional_ - a URL linking to an image of the bird

#### Returns

Normally, returns an `object` containing the bird's data. It should be identical to the inputs with an additional ID field. 

During errors, can return plain text or a JSON representation of the error

### POST `/add/level/`

Adds a new taxon to the table of taxa. Returns the created entry.

#### Request Body

- `name` : `String` - the Latin scientific name of the taxon
- `father` : 