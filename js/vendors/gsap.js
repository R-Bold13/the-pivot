import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm";
import ScrollTrigger from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger/+esm";
import SplitText from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/SplitText/+esm";
import Flip from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/Flip/+esm";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

export { ScrollTrigger, SplitText, Flip };
export default gsap;