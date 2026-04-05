export default function Hero() {
  return (
    <section className="relative h-[921px] flex items-center overflow-hidden bg-surface">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-90 scale-105"
          alt="serene close-up of rose quartz and amethyst crystals on a textured linen cloth with soft morning sunlight and blurred zen garden background"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5_85wz2fFa13ejvRi-arpGhI8SC0_D7hx-8FpBW4EwdkyR7vx8vpE10G0i3p1S90onwmLEkOuaFF1aNBwsxFr9ayGgpPif6fpMvgVY7jqpj_Qaf-DuLOtA6hXAai158Js1Ft7fvEo6pTtL2l_YATkCgtwrd3W5wjotaimjCDIlsPAjrXKhwiXZ-W4DXVfXb2fqq2dXA7yymPwAj0M5vvE-gTs6hmSIik45ezj_zwm_9_3VOv4wbqxH87RFiKFsVlhbX56-zP0tW-B"
        />
      </div>
      <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
        <div className="max-w-2xl">
          <span className="inline-block font-label uppercase tracking-widest text-xs mb-6 text-primary py-1 px-3 border border-outline-variant/40 rounded-full">
            Ancient Wisdom for Modern Spaces
          </span>
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-on-surface leading-tight -tracking-widest mb-8">
            Resonate with the <br />
            <i className="font-light">Earth&apos;s Core</i>
          </h1>
          <p className="text-lg text-on-surface-variant font-body leading-relaxed mb-12 max-w-lg">
            Our curated artifacts are selected through rigorous energetic
            assessment to bring balance, flow, and intentionality to your
            sanctuary.
          </p>
          <div className="flex space-x-6">
            <button className="bg-primary text-on-primary px-10 py-5 rounded-full font-label uppercase tracking-widest text-xs hover:bg-primary-container transition-all duration-300">
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
