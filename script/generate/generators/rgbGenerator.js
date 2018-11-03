import * as util from '../../util.js'

const color1 = "#000000";
const color2 = "#0000FF";
const color3 = "#00FF00";
const color4 = "#FF0000";

const colors = Object.freeze([
    color1, color2, color3, color4
]);

export default class CmyGenerator {

    get foregroundTextColor() {
        return "#FFFFFF";
    }

    get backgroundColor() {
        return "#000000";
    }

    getLayers(bits) {
        return util.layers(bits, 2);
    }

    generate(data, canvas, ctx) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        let layer = 1;
        let segment = 0;
        let total = util.segments(layer);

        for (let bit = 0; bit < data.length * 8; bit += 2) {
            const interval = 2 * Math.PI / total;
            const bits = [util.getBit(data, bit), util.getBit(data, bit + 1)];

            let color;
            if (bits[0] === 1 && bits[1] === 1) {
                color = color4;
            } else if (bits[0] === 0 && bits[1] === 1) {
                color = color3;
            } else if (bits[0] === 1 && bits[1] === 0) {
                color = color2;
            } else if (bits[0] === 0 && bits[1] === 0) {
            }
            if (typeof color !== "undefined") {
                ctx.strokeStyle = color;
                ctx.lineWidth = util.config.arcWidth;
                ctx.beginPath();
                ctx.arc(centerX, centerY, util.arcRadius(layer), util.config.startAngle + segment * interval, util.config.startAngle + (segment + 1) * interval);
                ctx.stroke();
            }
            segment++;
            if (segment === total) {
                layer++;
                segment = 0;
                total = util.segments(layer);
            }
        }
    }

}