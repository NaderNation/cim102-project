# EstateFlow class demo

## Suggested walkthrough

1. Open **Explore homes** or the featured Harbor View Residence on the dashboard.
2. Show the sample listing, approximate Miami area map link, and the prepared 3D walkthrough. Its progress bar reports the actual local scene file download and decoding. Choose **Start exploring**, then drag to look, use W A S D or arrow keys to walk, or click the movement arrows on the scene. **Reset view** returns to the starting position.
3. Return home and choose **New property**.
4. Select **Garden View Residence · sample details** from the dropdown. The form fills the sample address, price, size, beds and baths.
5. Continue to the photo step. One bundled exterior image appears. Use **Open prepared 3D tour** to demonstrate the no-wait path; it reads a scene bundled with the website instead of calling the generation API. The working interior is the default. The second supplied `.spz` is available as **Alternate supplied scan** in the viewer; its current rendering is incomplete.
6. Choose **Generate ad set** to save the demo property in this browser's catalog. It remains there after refresh.

## What the demo represents

These are illustrative examples. The exterior photos, sample city locations and prebuilt 3D scenes are separate assets; they are not verified views of the same real properties. The prepared tour demonstrates the browsing experience and the speed of a pre-generated result. It does not demonstrate a new 3D scene being generated from the included exterior photo.

The Harbor View listing is shipped with the site, so visitors to GitHub Pages see it. The Garden View preset and its scene are also shipped with the site, but the property only appears as a catalog entry in the browser where the guided form is completed. Normal user-added properties are currently saved in that browser only. Real map coordinates need verified addresses. Keeping a separate photo gallery for each property needs a change to the app's local IndexedDB structure; sharing listings and photos across devices needs a database and object storage service.

The two `.spz` files total about 57 MB. They avoid generation wait and API costs, but they still need time to download and decode on a visitor's device. The viewer shows real loading progress.
