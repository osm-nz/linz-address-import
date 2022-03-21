This part of the code does the following:

1. converts the conflated address data into `osmPatch` files
2. adds the `extraLayers`
3. splits the datasets into chunks
4. generates address stats
5. saves the osmPatch files and the index file.

### Logic for splitting datasets

```mermaid
graph TD
  E(("simple Address<br> Updates")) --> G{Less than<br/> 50 items?};
  F1 --> D;
  G -->|No| Done;
  G -->|Yes| F1;

  F(("special Address<br> Updates")) --> F1[create single nation-<br>wide dataset];

  A((Topo Datasets)) --> B{is in Antarctica?}
  C --> Done;
  B -->|No| D[Split into XS/S/M/L regions]
  B -->|Yes| C[Split into chunks of 100]

  D--> H{Does the<br/> XS/S/M/L chunk<br/> have too many<br/> items?}
  H-->|No| Done;
  H-->|Yes| I[Recursively <br/>split in half];
  I --> H;
```
