import preprocessSquare from "./preprocessSquare.js";

export default function detectSquare(reader, img, log, display) {
    let copy;
    let thresholded;

    copy = img.clone();

    display(copy);

    let c = 0;
    thresholded = copy.clone();
    cv.cvtColor(thresholded, thresholded, cv.COLOR_BGR2GRAY);

    cv.threshold(thresholded, thresholded, 70, 200, cv.THRESH_BINARY_INV);
    cv.blur(thresholded, thresholded, new cv.Size(5, 5));
    cv.threshold(thresholded, thresholded, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    display(thresholded);

    let contours = new cv.MatVector;
    let hierarchy = new cv.Mat;

    cv.blur(thresholded, thresholded, new cv.Size(7, 7));
    cv.findContours(thresholded, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    display(thresholded);

    let best = null;
    let bestArea = null;

    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let approx = new cv.Mat;
        cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);

        if (approx.rows === 4) {
            log("dt", "Found a quadrilateral");
            const area = cv.contourArea(approx);

            if (bestArea === null) {
                best = approx;
                bestArea = area;
            } else if (bestArea < area) {
                bestArea = area;
                best.delete();
                best = approx;
            } else approx.delete();

            contour.delete();
        } else {
            approx.delete();
            contour.delete();
        }
    }

    display(copy);

    let warped; // = new cv.Mat;

    if (best === null) {
        log("dt", "Could not detect a tag, using whole image");
        warped = img.clone();
    } else {
        let points = [];
        console.log(best.type());
        for (let i = 0; i < best.rows; ++i) {
            const ptr = best.intPtr(i, 0);
            points.push(ptr[0], ptr[1]);
        }

        console.log(`warp points: ${points}`);

        let inputArray = new cv.MatVector;
        inputArray.push_back(best);
        cv.drawContours(copy, inputArray, 0, new cv.Scalar(255, 0, 0, 0), 3);

        let mask = cv.Mat.zeros(copy.size(), cv.CV_8UC1);

        cv.drawContours(mask, inputArray, -1, new cv.Scalar(255), -1);
        display(mask);

        let masked = new cv.Mat;
        cv.bitwise_and(img, img, masked, mask);
        display(masked);

        warped = cv.Mat.zeros(new cv.Size(550, 550), img.type());
        let source = cv.matFromArray(4, 1, cv.CV_32FC2, points);
        let dest = cv.matFromArray(4, 1, cv.CV_32FC2, [550, 550, 550, 0, 0, 0, 0, 550]);

        let M = cv.getPerspectiveTransform(source, dest);

        cv.warpPerspective(masked, warped, M, new cv.Size(550, 550), cv.INTER_LINEAR, cv.BORDER_CONSTANT);

        display(warped);

        source.delete();
        dest.delete();
        M.delete();
        masked.delete();
        mask.delete();
        inputArray.delete();
    }

    best.delete();
    contours.delete();
    hierarchy.delete();
    copy.delete();

    log("read", "Detected square");

    cv.resize(warped, warped, new cv.Size(550, 550));

    const result = preprocessSquare(reader, warped, log, display);

    warped.delete();
    thresholded.delete();

    return result;
}