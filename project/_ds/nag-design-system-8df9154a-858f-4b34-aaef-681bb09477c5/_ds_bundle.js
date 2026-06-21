/* @ds-bundle: {"format":3,"namespace":"NostalgiaAutoGalleryDesignSystem_8df915","components":[{"name":"ServiceCard","sourcePath":"components/automotive/ServiceCard.jsx"},{"name":"SpecGrid","sourcePath":"components/automotive/SpecGrid.jsx"},{"name":"VehicleCard","sourcePath":"components/automotive/VehicleCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"GearRule","sourcePath":"components/core/GearRule.jsx"},{"name":"PlateTag","sourcePath":"components/core/PlateTag.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"}],"sourceHashes":{"components/automotive/ServiceCard.jsx":"f69925643c6b","components/automotive/SpecGrid.jsx":"fb7a32c85527","components/automotive/VehicleCard.jsx":"a2f76dd9ae24","components/core/Badge.jsx":"c81f33927fd1","components/core/Button.jsx":"b16d555c3d05","components/core/Card.jsx":"2b2d8e6ddad6","components/core/Eyebrow.jsx":"f0f234a7cd49","components/core/GearRule.jsx":"6365238d9fc4","components/core/PlateTag.jsx":"a460d0f7dbb7","components/core/Stat.jsx":"55c331a76463","components/core/Tag.jsx":"908ca10043e5","components/forms/Field.jsx":"582efac70312","components/forms/Select.jsx":"7ceddc9ade39","ui_kits/vitrine/App.jsx":"639b0b030cc4","ui_kits/vitrine/Home.jsx":"6d80308f3bb3","ui_kits/vitrine/Services.jsx":"eb08fcc060bc","ui_kits/vitrine/Stock.jsx":"a04f18e6121f","ui_kits/vitrine/Vehicle.jsx":"4c5a72737b63","ui_kits/vitrine/data.js":"c3db0f8a0211","ui_kits/vitrine/sections.jsx":"dcf656208e4f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NostalgiaAutoGalleryDesignSystem_8df915 = window.NostalgiaAutoGalleryDesignSystem_8df915 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/automotive/ServiceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ServiceCard — promotes a service (Detailing, Vente, Pièces détachées).
 * Numbered index, condensed title, description, "à partir de" price, hover lift.
 */
function ServiceCard({
  index = '01',
  title = 'Detailing',
  icon,
  description = '',
  priceFrom,
  bullets = [],
  dark = false,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: 'var(--sp-6)',
      background: dark ? 'var(--ink-700)' : 'var(--surface-card)',
      border: `1px solid ${dark ? 'var(--border-on-dark)' : 'var(--border-hair)'}`,
      borderRadius: 'var(--r-md)',
      boxShadow: h ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      transition: 'box-shadow var(--dur-2) var(--ease-out), border-color var(--dur-2) var(--ease-out)',
      borderColor: h ? 'var(--red-300)' : dark ? 'var(--border-on-dark)' : 'var(--border-hair)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--brand)',
      letterSpacing: '.1em'
    }
  }, index), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      color: dark ? 'var(--text-on-dark)' : 'var(--text-strong)'
    }
  }, icon)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 26,
      textTransform: 'uppercase',
      letterSpacing: '-.01em',
      lineHeight: .98,
      color: dark ? 'var(--text-on-dark)' : 'var(--text-strong)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      lineHeight: 1.55,
      color: dark ? 'var(--text-on-dark-muted)' : 'var(--text-muted)'
    }
  }, description), bullets.length > 0 && /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, bullets.map((b, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 9,
      fontFamily: 'var(--font-text)',
      fontSize: 13.5,
      color: dark ? 'var(--text-on-dark-muted)' : 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 700
    }
  }, "\u2014"), b))), priceFrom && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12,
      borderTop: `1px solid ${dark ? 'var(--border-on-dark)' : 'var(--border-hair)'}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-faint)'
    }
  }, "\xC0 partir de "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      color: dark ? 'var(--text-on-dark)' : 'var(--text-strong)'
    }
  }, priceFrom)));
}
Object.assign(__ds_scope, { ServiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/automotive/ServiceCard.jsx", error: String((e && e.message) || e) }); }

// components/automotive/SpecGrid.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SpecGrid — technical spec sheet: label/value rows in a tidy two-column grid.
 * Mono labels, condensed values, hairline separators. For vehicle detail pages.
 */
function SpecGrid({
  specs = [],
  columns = 2,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
      gap: '1px',
      background: 'var(--border-hair)',
      border: '1px solid var(--border-hair)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden',
      ...style
    }
  }, rest), specs.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      padding: '12px 14px',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-faint)'
    }
  }, s.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 18,
      color: 'var(--text-strong)',
      letterSpacing: '-.005em'
    }
  }, s.value))));
}
Object.assign(__ds_scope, { SpecGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/automotive/SpecGrid.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — compact status pill.
 * Tones: red, sun, ok, warn, info, neutral, ink. Optional dot + outline style.
 */
function Badge({
  children,
  tone = 'neutral',
  outline = false,
  dot = false,
  style,
  ...rest
}) {
  const tones = {
    red: {
      fg: 'var(--red-700)',
      bg: 'var(--red-50)',
      bd: 'var(--red-200)',
      solidBg: 'var(--brand)'
    },
    sun: {
      fg: 'var(--sun-600)',
      bg: 'var(--warn-50)',
      bd: '#F0CE97',
      solidBg: 'var(--sun-500)'
    },
    ok: {
      fg: 'var(--ok-500)',
      bg: 'var(--ok-50)',
      bd: '#BFE0CC',
      solidBg: 'var(--ok-500)'
    },
    warn: {
      fg: 'var(--warn-500)',
      bg: 'var(--warn-50)',
      bd: '#EFD9A3',
      solidBg: 'var(--warn-500)'
    },
    info: {
      fg: 'var(--info-500)',
      bg: 'var(--info-50)',
      bd: '#BcCfE6',
      solidBg: 'var(--info-500)'
    },
    neutral: {
      fg: 'var(--steel-700)',
      bg: 'var(--steel-100)',
      bd: 'var(--steel-300)',
      solidBg: 'var(--steel-700)'
    },
    ink: {
      fg: '#fff',
      bg: 'var(--ink-800)',
      bd: '#000',
      solidBg: 'var(--ink-800)'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 9px 3px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: outline ? t.fg : tone === 'neutral' ? t.fg : t.fg,
      background: outline ? 'transparent' : t.bg,
      border: `1px solid ${t.bd}`,
      borderRadius: 'var(--r-xs)',
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.solidBg,
      display: 'inline-block'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — Nostalgia Auto Gallery primary action.
 * Variants: primary (brand red), chrome (brushed steel), ghost, ink (dark), link.
 * Sizes: sm, md, lg. Square-ish industrial radius, mechanical press.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 14px',
      fontSize: 13,
      gap: 7
    },
    md: {
      padding: '11px 20px',
      fontSize: 14.5,
      gap: 9
    },
    lg: {
      padding: '15px 28px',
      fontSize: 16,
      gap: 10
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: 'var(--text-on-red)',
      border: '1px solid var(--red-600)',
      boxShadow: '0 1px 0 rgba(255,255,255,.18) inset, var(--shadow-sm)'
    },
    chrome: {
      background: 'var(--grad-chrome)',
      color: 'var(--ink-900)',
      border: '1px solid var(--steel-400)',
      boxShadow: '0 1px 0 rgba(255,255,255,.7) inset, var(--shadow-sm)'
    },
    ink: {
      background: 'var(--grad-ink)',
      color: 'var(--text-on-dark)',
      border: '1px solid #000',
      boxShadow: '0 1px 0 rgba(255,255,255,.08) inset, var(--shadow-sm)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-strong)',
      border: '1.5px solid var(--border-strong)',
      boxShadow: 'none'
    },
    link: {
      background: 'transparent',
      color: 'var(--text-link)',
      border: '1px solid transparent',
      boxShadow: 'none',
      padding: 0
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      padding: variant === 'link' ? 0 : s.padding,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: s.fontSize,
      textTransform: variant === 'link' ? 'none' : 'uppercase',
      letterSpacing: variant === 'link' ? 0 : '.05em',
      lineHeight: 1,
      borderRadius: variant === 'link' ? 0 : 'var(--r-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--dur-1) var(--ease-mech), filter var(--dur-2) var(--ease-out), background var(--dur-2) var(--ease-out)',
      whiteSpace: 'nowrap',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled && variant !== 'link') e.currentTarget.style.transform = 'translateY(1px) scale(.99)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = '';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = '';
      if (!disabled) e.currentTarget.style.filter = '';
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = variant === 'primary' || variant === 'ink' ? 'brightness(1.08)' : 'brightness(.97)';
    }
  }, rest), iconLeft, variant === 'link' ? /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: '2px solid currentColor',
      paddingBottom: 1
    }
  }, children) : children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/automotive/VehicleCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * VehicleCard — listing tile for a car in stock. Photo with protection gradient,
 * status badge, condensed title, mono spec row (year · km · gearbox), price.
 */
function VehicleCard({
  image,
  title = 'Nissan 180SX',
  subtitle = 'Type X — Fastback',
  year = '1991',
  km = '142 000 km',
  gearbox = 'BVM5',
  fuel = 'Essence',
  price = '12 900 €',
  status = 'Disponible',
  statusTone = 'ok',
  onView,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const specs = [year, km, gearbox, fuel].filter(Boolean);
  return /*#__PURE__*/React.createElement("article", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hair)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      boxShadow: h ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transform: h ? 'translateY(-4px)' : 'none',
      transition: 'transform var(--dur-2) var(--ease-out), box-shadow var(--dur-2) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '16/10',
      overflow: 'hidden',
      background: 'var(--ink-800)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: h ? 'scale(1.05)' : 'scale(1)',
      transition: 'transform var(--dur-4) var(--ease-out)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--grad-ink)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--grad-protect)',
      opacity: .55
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: statusTone,
    dot: true
  }, status)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 10,
      right: 12,
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 12,
      color: '#fff',
      letterSpacing: '.06em',
      textShadow: '0 1px 4px rgba(0,0,0,.6)'
    }
  }, year)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--sp-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      textTransform: 'uppercase',
      letterSpacing: '-.01em',
      lineHeight: 1,
      color: 'var(--text-strong)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontFamily: 'var(--font-text)',
      fontSize: 13.5,
      color: 'var(--text-muted)'
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px 10px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-muted)',
      letterSpacing: '.02em'
    }
  }, specs.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--steel-300)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 6,
      borderTop: '1px solid var(--border-hair)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-faint)'
    }
  }, "Prix"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 26,
      color: 'var(--brand)',
      lineHeight: 1
    }
  }, price)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "ink",
    onClick: onView
  }, "Voir"))));
}
Object.assign(__ds_scope, { VehicleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/automotive/VehicleCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — base surface container. The brand card is crisp: hairline border,
 * small radius, layered cool shadow, optional brand-red accent bar at top,
 * and a subtle hover lift.
 */
function Card({
  children,
  accent = false,
  hover = false,
  pad = 'md',
  as = 'div',
  style,
  ...rest
}) {
  const pads = {
    none: 0,
    sm: 'var(--sp-4)',
    md: 'var(--sp-6)',
    lg: 'var(--sp-8)'
  };
  const El = as;
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement(El, _extends({
    onMouseEnter: hover ? () => setH(true) : undefined,
    onMouseLeave: hover ? () => setH(false) : undefined,
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hair)',
      borderRadius: 'var(--r-md)',
      padding: pads[pad],
      boxShadow: h ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transform: h ? 'translateY(-3px)' : 'none',
      transition: 'transform var(--dur-2) var(--ease-out), box-shadow var(--dur-2) var(--ease-out)',
      overflow: 'hidden',
      ...style
    }
  }, rest), accent && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--bw-rule)',
      background: 'var(--brand)'
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Eyebrow — mono overline label with optional leading tick. Pairs above headings.
 */
function Eyebrow({
  children,
  tone = 'brand',
  tick = true,
  style,
  ...rest
}) {
  const color = tone === 'brand' ? 'var(--brand)' : tone === 'muted' ? 'var(--text-muted)' : 'var(--text-on-dark-muted)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color,
      ...style
    }
  }, rest), tick && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 2,
      background: 'currentColor',
      display: 'inline-block'
    }
  }), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/GearRule.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * GearRule — horizontal divider with a centered brand mark (gear ◆ / chevron).
 * Echoes the cog motif from the emblem. Use to separate sections.
 */
function GearRule({
  mark = '◆',
  tone = 'default',
  style,
  ...rest
}) {
  const line = tone === 'dark' ? 'var(--border-on-dark)' : 'var(--border-soft)';
  const glyph = tone === 'dark' ? 'var(--red-300)' : 'var(--brand)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: line
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: glyph,
      fontSize: 12,
      letterSpacing: '.3em',
      display: 'inline-flex',
      gap: 4
    }
  }, mark), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: line
    }
  }));
}
Object.assign(__ds_scope, { GearRule });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/GearRule.jsx", error: String((e && e.message) || e) }); }

// components/core/PlateTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PlateTag — French registration-plate motif. A signature brand element used
 * for vehicle IDs, reference codes, and stat call-outs. Blue "F" strip + mono
 * number on a white plate, optional department code on the right.
 */
function PlateTag({
  children = 'BX-605-HJ',
  dept = '30',
  region = 'F',
  size = 'md',
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      h: 26,
      fs: 14,
      pad: '0 8px',
      strip: 16,
      deptFs: 9
    },
    md: {
      h: 34,
      fs: 19,
      pad: '0 12px',
      strip: 20,
      deptFs: 11
    },
    lg: {
      h: 46,
      fs: 26,
      pad: '0 16px',
      strip: 26,
      deptFs: 13
    }
  };
  const s = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'stretch',
      height: s.h,
      background: 'var(--plate-white)',
      border: '1.5px solid #14110A',
      borderRadius: 'var(--r-xs)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)',
      fontFamily: 'var(--font-mono)',
      verticalAlign: 'middle',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: s.strip,
      background: 'var(--plate-blue)',
      color: '#fff',
      fontWeight: 700,
      fontSize: s.deptFs,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: s.deptFs + 1
    }
  }, region)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: s.pad,
      fontWeight: 700,
      fontSize: s.fs,
      letterSpacing: '.04em',
      color: '#14110A'
    }
  }, children), dept && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: s.strip + 2,
      background: 'var(--plate-blue)',
      color: '#fff',
      gap: 1,
      fontWeight: 700,
      fontSize: s.deptFs,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: s.deptFs - 1,
      opacity: .85
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("span", null, dept)));
}
Object.assign(__ds_scope, { PlateTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PlateTag.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Stat — big condensed metric with mono label. For specs and headline figures
 * (e.g. "1991 · Year", "205 ch", "+150 véhicules détaillés").
 */
function Stat({
  value,
  label,
  suffix,
  accent = false,
  align = 'left',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      textAlign: align,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      lineHeight: .9,
      fontSize: 'clamp(34px, 4vw, 52px)',
      letterSpacing: '-.01em',
      color: accent ? 'var(--brand)' : 'var(--text-strong)',
      textTransform: 'uppercase'
    }
  }, value, suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.5em',
      color: 'var(--text-muted)',
      marginLeft: 4
    }
  }, suffix)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, label));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — category / filter chip (e.g. JDM, Youngtimer, Detailing, Turbo).
 * selectable + removable variants.
 */
function Tag({
  children,
  selected = false,
  onClick,
  onRemove,
  icon,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 11px',
      fontFamily: 'var(--font-text)',
      fontWeight: 600,
      fontSize: 13,
      letterSpacing: '.01em',
      color: selected ? 'var(--text-on-red)' : 'var(--text-body)',
      background: selected ? 'var(--brand)' : 'var(--surface-raised)',
      border: `1px solid ${selected ? 'var(--red-600)' : 'var(--border-soft)'}`,
      borderRadius: 'var(--r-pill)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all var(--dur-2) var(--ease-out)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      ...style
    }
  }, rest), icon, children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      display: 'inline-flex',
      border: 'none',
      background: 'transparent',
      color: 'currentColor',
      cursor: 'pointer',
      padding: 0,
      marginLeft: 1,
      opacity: .6,
      fontSize: 15,
      lineHeight: 1
    },
    "aria-label": "Retirer"
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Field — labelled text input with optional hint/error and mono label.
 */
function Field({
  label,
  hint,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  prefix,
  id,
  style,
  ...rest
}) {
  const fid = id || (label ? 'f-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-muted)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      background: 'var(--surface-raised)',
      border: `1.5px solid ${error ? 'var(--danger-500)' : 'var(--border-soft)'}`,
      borderRadius: 'var(--r-sm)',
      padding: '0 12px',
      transition: 'border-color var(--dur-2) var(--ease-out), box-shadow var(--dur-2) var(--ease-out)'
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      marginRight: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    required: required,
    onFocus: e => {
      if (!error) {
        e.target.parentNode.style.borderColor = 'var(--brand)';
        e.target.parentNode.style.boxShadow = '0 0 0 3px var(--red-50)';
      }
    },
    onBlur: e => {
      e.target.parentNode.style.borderColor = error ? 'var(--danger-500)' : 'var(--border-soft)';
      e.target.parentNode.style.boxShadow = 'none';
    },
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: '11px 0',
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      color: 'var(--text-strong)'
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: error ? 'var(--danger-500)' : 'var(--text-faint)',
      fontFamily: 'var(--font-text)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — labelled native select styled to match Field (chrome chevron).
 */
function Select({
  label,
  value,
  onChange,
  options = [],
  required = false,
  id,
  style,
  ...rest
}) {
  const fid = id || (label ? 's-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-muted)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fid,
    value: value,
    onChange: onChange,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      padding: '12px 38px 12px 12px',
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      color: 'var(--text-strong)',
      background: 'var(--surface-raised)',
      border: '1.5px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      cursor: 'pointer',
      outline: 'none'
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--brand)';
      e.target.style.boxShadow = '0 0 0 3px var(--red-50)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--border-soft)';
      e.target.style.boxShadow = 'none';
    }
  }, rest), options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--steel-500)',
      fontSize: 11
    }
  }, "\u25BC")));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/App.jsx
try { (() => {
// App router — simple state-based navigation across the Vitrine site.
function App() {
  const [route, setRoute] = React.useState('home');
  const [vehicleId, setVehicleId] = React.useState(window.NAG.STOCK[0].id);
  const scrollTop = () => window.scrollTo({
    top: 0,
    behavior: 'instant' in window ? 'instant' : 'auto'
  });
  const go = r => {
    setRoute(r);
    scrollTop();
  };
  const openVehicle = id => {
    setVehicleId(id);
    setRoute('vehicle');
    scrollTop();
  };
  let screen;
  if (route === 'home') screen = /*#__PURE__*/React.createElement(window.Home, {
    go: go,
    openVehicle: openVehicle
  });else if (route === 'stock') screen = /*#__PURE__*/React.createElement(window.Stock, {
    openVehicle: openVehicle
  });else if (route === 'vehicle') screen = /*#__PURE__*/React.createElement(window.Vehicle, {
    id: vehicleId,
    go: go,
    openVehicle: openVehicle
  });else if (route === 'services') screen = /*#__PURE__*/React.createElement(window.Services, {
    go: go
  });else if (route === 'contact') screen = /*#__PURE__*/React.createElement(window.Contact, null);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(window.Header, {
    route: route,
    go: go
  }), screen, /*#__PURE__*/React.createElement(window.Footer, {
    go: go
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/Home.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Home / landing screen.
const NAGDS = window.NostalgiaAutoGalleryDesignSystem_8df915;
function Hero({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "nag-dark",
    style: {
      position: 'relative',
      minHeight: 'min(86vh, 760px)',
      display: 'flex',
      alignItems: 'flex-end',
      overflow: 'hidden',
      background: 'var(--ink-900)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photos/hero-pavilion-s13.jpg",
    alt: "Nissan 180SX au coucher du soleil",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(13,14,16,.55) 0%, rgba(13,14,16,.15) 38%, rgba(13,14,16,.82) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: 'clamp(24px,5vw,64px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement(NAGDS.Eyebrow, {
    tone: "on-dark"
  }, "Detailing \xB7 Vente \xB7 Pi\xE8ces \u2014 Gard (30)"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      textTransform: 'uppercase',
      color: '#fff',
      fontSize: 'clamp(46px,8vw,108px)',
      lineHeight: .9,
      letterSpacing: '-.02em',
      margin: '18px 0 0',
      maxWidth: 16 + 'ch'
    }
  }, "La passion", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--red-400)'
    }
  }, "du d\xE9tail.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 'clamp(16px,1.6vw,20px)',
      lineHeight: 1.6,
      color: 'var(--text-on-dark)',
      maxWidth: 540,
      marginTop: 22
    }
  }, "Une voiture n'est pas qu'un moyen de transport \u2014 c'est un objet qui m\xE9rite attention et soin. Je mets mon expertise au service des passionn\xE9s."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(NAGDS.Button, {
    size: "lg",
    variant: "primary",
    onClick: () => go('stock')
  }, "Voir le stock"), /*#__PURE__*/React.createElement(NAGDS.Button, {
    size: "lg",
    variant: "chrome",
    onClick: () => go('services')
  }, "Nos prestations")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'clamp(28px,5vw,64px)',
      marginTop: 'clamp(32px,5vw,56px)'
    }
  }, /*#__PURE__*/React.createElement(NAGDS.Stat, {
    value: "+150",
    label: "V\xE9hicules soign\xE9s",
    accent: true
  }), /*#__PURE__*/React.createElement(NAGDS.Stat, {
    value: "JDM",
    label: "& Youngtimers"
  }), /*#__PURE__*/React.createElement(NAGDS.Stat, {
    value: "30",
    suffix: "+ dpt",
    label: "Zone d'intervention"
  }))));
}
function ServicesStrip({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-page)',
      padding: 'clamp(56px,8vw,104px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Ce que je fais",
    title: "Deux piliers, un seul soin extr\xEAme",
    intro: "Du detailing \xE0 la transaction, chaque v\xE9hicule est trait\xE9 avec la m\xEAme rigueur."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 20,
      marginTop: 40
    }
  }, window.NAG.SERVICES.map(s => /*#__PURE__*/React.createElement(NAGDS.ServiceCard, _extends({
    key: s.index
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(NAGDS.Button, {
    variant: "link",
    onClick: () => go('services')
  }, "D\xE9tail des prestations"))));
}
function FeaturedStock({
  go,
  openVehicle
}) {
  const featured = window.NAG.STOCK.slice(0, 3);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-sunken)',
      padding: 'clamp(56px,8vw,104px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Le stock",
    title: "S\xE9lection du moment"
  }), /*#__PURE__*/React.createElement(NAGDS.Button, {
    variant: "ghost",
    onClick: () => go('stock')
  }, "Tout le stock")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 22,
      marginTop: 40
    }
  }, featured.map(v => /*#__PURE__*/React.createElement(NAGDS.VehicleCard, _extends({
    key: v.id
  }, v, {
    onView: () => openVehicle(v.id)
  }))))));
}
function WhyBand() {
  const reasons = [['Expertise & rigueur', "Une approche professionnelle pour des prestations à la hauteur de vos attentes."], ['Passion automobile', "Chaque véhicule traité avec un soin extrême, vente comme detailing."], ['Proximité & mobilité', "Déplacement à domicile dans tout le Gard (30) et les départements voisins."]];
  return /*#__PURE__*/React.createElement("section", {
    className: "nag-dark",
    style: {
      background: 'var(--ink-800)',
      color: 'var(--text-on-dark)',
      padding: 'clamp(56px,8vw,104px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    light: true,
    eyebrow: "Pourquoi me choisir",
    title: "Le travail bien fait, sans compromis"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))',
      gap: 36,
      marginTop: 44
    }
  }, reasons.map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--red-300)',
      letterSpacing: '.12em',
      marginBottom: 14
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 23,
      margin: '0 0 10px',
      color: '#fff',
      lineHeight: 1.05
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-on-dark-muted)',
      margin: 0
    }
  }, d))))));
}
function CtaBand({
  go
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--brand)',
      color: '#fff',
      padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      textTransform: 'uppercase',
      fontSize: 'clamp(28px,3.6vw,46px)',
      lineHeight: .98,
      letterSpacing: '-.01em',
      margin: 0
    }
  }, "Un projet auto ?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 17,
      marginTop: 12,
      color: 'rgba(255,255,255,.9)',
      maxWidth: 520
    }
  }, "Recherche de v\xE9hicule, pi\xE8ces, ou redonner une seconde jeunesse \xE0 votre auto \u2014 contactez-moi pour un devis personnalis\xE9.")), /*#__PURE__*/React.createElement(NAGDS.Button, {
    size: "lg",
    variant: "ink",
    onClick: () => go('contact')
  }, "Demander un devis")));
}
function Home({
  go,
  openVehicle
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Hero, {
    go: go
  }), /*#__PURE__*/React.createElement(ServicesStrip, {
    go: go
  }), /*#__PURE__*/React.createElement(FeaturedStock, {
    go: go,
    openVehicle: openVehicle
  }), /*#__PURE__*/React.createElement(WhyBand, null), /*#__PURE__*/React.createElement(CtaBand, {
    go: go
  }));
}
Object.assign(window, {
  Home
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/Services.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Services detail + Contact screens.
const NAGDS_C = window.NostalgiaAutoGalleryDesignSystem_8df915;
function Services({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nag-dark",
    style: {
      background: 'var(--ink-900)',
      color: '#fff',
      padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(NAGDS_C.Eyebrow, {
    tone: "on-dark"
  }, "Prestations"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      textTransform: 'uppercase',
      fontSize: 'clamp(36px,5vw,68px)',
      lineHeight: .92,
      letterSpacing: '-.02em',
      margin: '14px 0 0'
    }
  }, "Detailing & solutions auto"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 16.5,
      color: 'var(--text-on-dark-muted)',
      marginTop: 14,
      maxWidth: 600
    }
  }, "Une offre compl\xE8te articul\xE9e autour de deux piliers : le soin esth\xE9tique, et l'achat-revente de v\xE9hicules et pi\xE8ces."))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
      gap: 22
    }
  }, window.NAG.SERVICES.map(s => /*#__PURE__*/React.createElement(NAGDS_C.ServiceCard, _extends({
    key: s.index
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'clamp(48px,7vw,88px)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "La m\xE9thode",
    title: "Comment \xE7a se passe"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))',
      gap: 24,
      marginTop: 36
    }
  }, [['Échange', 'On discute de votre besoin et de votre véhicule.'], ['Devis', 'Une estimation claire et personnalisée, sans surprise.'], ['Intervention', 'À l\'atelier ou en déplacement à domicile dans le Gard.'], ['Restitution', 'Un véhicule soigné, et des conseils pour l\'entretenir.']].map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderTop: '3px solid var(--brand)',
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--brand)',
      letterSpacing: '.12em',
      marginBottom: 8
    }
  }, `0${i + 1}`), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 21,
      margin: '0 0 8px',
      color: 'var(--text-strong)'
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      lineHeight: 1.55,
      color: 'var(--text-muted)',
      margin: 0
    }
  }, d))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'clamp(40px,6vw,72px)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(NAGDS_C.Button, {
    size: "lg",
    onClick: () => go('contact')
  }, "Demander un devis"))));
}
function Contact() {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      minHeight: '70vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px) clamp(56px,8vw,96px)',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(300px,.85fr)',
      gap: 'clamp(28px,5vw,64px)',
      alignItems: 'start'
    },
    className: "nag-veh-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NAGDS_C.Eyebrow, null, "Contact"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      textTransform: 'uppercase',
      fontSize: 'clamp(34px,5vw,60px)',
      lineHeight: .92,
      letterSpacing: '-.02em',
      margin: '14px 0 0',
      color: 'var(--text-strong)'
    }
  }, "Un projet auto ?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 17,
      lineHeight: 1.6,
      color: 'var(--text-muted)',
      marginTop: 14,
      maxWidth: 480
    }
  }, "Que vous cherchiez votre prochain v\xE9hicule, des pi\xE8ces, ou un detailing \u2014 \xE9crivez-moi, je r\xE9ponds personnellement."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, [['Téléphone', '04 48 21 61 51'], ['Email', 'contact@nostalgia-auto.fr'], ['Atelier', 'Parignargues, 30730 — Gard'], ['Zone', 'Gard (30) & départements voisins']].map(([k, val]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: 'var(--text-faint)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 17,
      color: 'var(--text-strong)'
    }
  }, val))))), /*#__PURE__*/React.createElement(NAGDS_C.Card, {
    pad: "lg"
  }, sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '32px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      color: 'var(--brand)'
    }
  }, "\u2726"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 24,
      margin: '12px 0 8px',
      color: 'var(--text-strong)'
    }
  }, "Demande envoy\xE9e"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 20px'
    }
  }, "Merci ! Je vous recontacte au plus vite. \xC0 tr\xE8s vite chez Nostalgia Auto Gallery."), /*#__PURE__*/React.createElement(NAGDS_C.Button, {
    variant: "ghost",
    onClick: () => setSent(false)
  }, "Nouvelle demande")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(NAGDS_C.Field, {
    label: "Nom",
    placeholder: "Jean Dupont",
    required: true
  }), /*#__PURE__*/React.createElement(NAGDS_C.Field, {
    label: "T\xE9l\xE9phone",
    placeholder: "06 12 34 56 78"
  })), /*#__PURE__*/React.createElement(NAGDS_C.Field, {
    label: "Email",
    type: "email",
    placeholder: "vous@email.fr",
    required: true
  }), /*#__PURE__*/React.createElement(NAGDS_C.Select, {
    label: "Type de demande",
    options: ['Vente — recherche véhicule', 'Detailing', 'Pièces détachées', 'Reprise / dépôt-vente']
  }), /*#__PURE__*/React.createElement(NAGDS_C.Field, {
    label: "Budget",
    prefix: "\u20AC",
    placeholder: "Indicatif"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-muted)'
    }
  }, "Message"), /*#__PURE__*/React.createElement("textarea", {
    rows: 4,
    placeholder: "D\xE9crivez votre projet\u2026",
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      padding: 12,
      border: '1.5px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      resize: 'vertical',
      outline: 'none',
      color: 'var(--text-strong)',
      background: 'var(--surface-raised)'
    }
  })), /*#__PURE__*/React.createElement(NAGDS_C.Button, {
    type: "submit",
    block: true,
    size: "lg"
  }, "Envoyer la demande")))));
}
Object.assign(window, {
  Services,
  Contact
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/Services.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/Stock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Stock / inventory listing with filters.
const NAGDS_S = window.NostalgiaAutoGalleryDesignSystem_8df915;
function Stock({
  openVehicle
}) {
  const [filter, setFilter] = React.useState('Tous');
  const [sort, setSort] = React.useState('Récents');
  const filters = ['Tous', 'JDM', 'Youngtimer', 'Turbo'];
  let list = window.NAG.STOCK.filter(v => filter === 'Tous' || v.tags.includes(filter));
  if (sort === 'Prix') {
    list = [...list].sort((a, b) => parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, '')));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      minHeight: '70vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nag-dark",
    style: {
      background: 'var(--ink-900)',
      color: '#fff',
      padding: 'clamp(40px,6vw,76px) clamp(16px,4vw,48px) clamp(28px,4vw,44px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(NAGDS_S.Eyebrow, {
    tone: "on-dark"
  }, "Le stock"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      textTransform: 'uppercase',
      fontSize: 'clamp(36px,5vw,68px)',
      lineHeight: .92,
      letterSpacing: '-.02em',
      margin: '14px 0 0'
    }
  }, "V\xE9hicules disponibles"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 16.5,
      color: 'var(--text-on-dark-muted)',
      marginTop: 14,
      maxWidth: 560
    }
  }, "Une s\xE9lection rigoureuse de JDM et de youngtimers. \xC9tat, historique et qualit\xE9 v\xE9rifi\xE9s sur chaque auto."))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 71,
      zIndex: 20,
      background: 'rgba(245,242,234,.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border-hair)',
      padding: '14px clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      flexWrap: 'wrap'
    }
  }, filters.map(f => /*#__PURE__*/React.createElement(NAGDS_S.Tag, {
    key: f,
    selected: filter === f,
    onClick: () => setFilter(f)
  }, f))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-muted)',
      letterSpacing: '.06em'
    }
  }, list.length, " R\xC9SULTATS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['Récents', 'Prix'].map(s => /*#__PURE__*/React.createElement(NAGDS_S.Tag, {
    key: s,
    selected: sort === s,
    onClick: () => setSort(s)
  }, s)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: 'clamp(28px,4vw,48px) clamp(16px,4vw,48px) clamp(56px,8vw,96px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
      gap: 22
    }
  }, list.map(v => /*#__PURE__*/React.createElement(NAGDS_S.VehicleCard, _extends({
    key: v.id
  }, v, {
    onView: () => openVehicle(v.id)
  }))))));
}
Object.assign(window, {
  Stock
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/Stock.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/Vehicle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Vehicle detail screen.
const NAGDS_V = window.NostalgiaAutoGalleryDesignSystem_8df915;
function Vehicle({
  id,
  go,
  openVehicle
}) {
  const v = window.NAG.STOCK.find(x => x.id === id) || window.NAG.STOCK[0];
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    setActive(0);
  }, [id]);
  const photos = v.gallery && v.gallery.length ? v.gallery : [v.image.split('/').pop()];
  const more = window.NAG.STOCK.filter(x => x.id !== v.id).slice(0, 3);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '20px clamp(16px,4vw,48px) 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: '.04em',
      color: 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    },
    onClick: () => go('home')
  }, "Accueil"), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 8px'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    },
    onClick: () => go('stock')
  }, "Stock"), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 8px'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-strong)'
    }
  }, v.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: 'clamp(20px,3vw,32px) clamp(16px,4vw,48px) clamp(56px,8vw,96px)',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, .9fr)',
      gap: 'clamp(24px,4vw,48px)',
      alignItems: 'start'
    },
    className: "nag-veh-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '16/10',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      background: 'var(--ink-800)',
      boxShadow: 'var(--shadow-md)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.NAG.PHOTOS + photos[active],
    alt: v.title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14
    }
  }, /*#__PURE__*/React.createElement(NAGDS_V.Badge, {
    tone: v.statusTone,
    dot: true
  }, v.status))), photos.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 12
    }
  }, photos.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setActive(i),
    style: {
      width: 92,
      height: 62,
      padding: 0,
      border: active === i ? '2px solid var(--brand)' : '1px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden',
      cursor: 'pointer',
      background: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.NAG.PHOTOS + p,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(NAGDS_V.Eyebrow, null, "\xC0 propos de ce v\xE9hicule"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 16.5,
      lineHeight: 1.65,
      color: 'var(--text-body)',
      marginTop: 14
    }
  }, v.blurb)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: 'var(--text-faint)',
      marginBottom: 12
    }
  }, "Caract\xE9ristiques"), /*#__PURE__*/React.createElement(NAGDS_V.SpecGrid, {
    columns: 3,
    specs: [{
      label: 'Année',
      value: v.year
    }, {
      label: 'Kilométrage',
      value: v.km.replace(' km', '')
    }, {
      label: 'Boîte',
      value: v.gearbox
    }, {
      label: 'Énergie',
      value: v.fuel
    }, {
      label: 'Puissance',
      value: v.power
    }, {
      label: 'Département',
      value: v.dept
    }]
  }))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'sticky',
      top: 92
    }
  }, /*#__PURE__*/React.createElement(NAGDS_V.Card, {
    pad: "lg",
    accent: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap',
      marginBottom: 12
    }
  }, v.tags.map(t => /*#__PURE__*/React.createElement(NAGDS_V.Badge, {
    key: t,
    tone: "neutral"
  }, t))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 'clamp(28px,3vw,38px)',
      lineHeight: .95,
      letterSpacing: '-.01em',
      margin: 0,
      color: 'var(--text-strong)'
    }
  }, v.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, v.subtitle), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      margin: '20px 0',
      paddingBottom: 18,
      borderBottom: '1px solid var(--border-hair)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--text-faint)'
    }
  }, "Prix"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 42,
      color: 'var(--brand)',
      lineHeight: .9
    }
  }, v.price)), /*#__PURE__*/React.createElement(NAGDS_V.PlateTag, {
    dept: v.dept,
    size: "sm"
  }, v.plate)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(NAGDS_V.Button, {
    block: true,
    size: "lg",
    variant: "primary",
    disabled: v.status === 'Vendu',
    onClick: () => go('contact')
  }, v.status === 'Vendu' ? 'Véhicule vendu' : 'Réserver ce véhicule'), /*#__PURE__*/React.createElement(NAGDS_V.Button, {
    block: true,
    variant: "ghost",
    onClick: () => go('contact')
  }, "Poser une question")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      marginTop: 18,
      fontFamily: 'var(--font-text)',
      fontSize: 13.5,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontSize: 16
    }
  }, "\u2726"), "Detailing complet offert \xE0 l'achat.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-sunken)',
      padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Aussi au stock",
    title: "Autres v\xE9hicules"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
      gap: 22,
      marginTop: 36
    }
  }, more.map(m => /*#__PURE__*/React.createElement(NAGDS_V.VehicleCard, _extends({
    key: m.id
  }, m, {
    onView: () => openVehicle(m.id)
  })))))));
}
Object.assign(window, {
  Vehicle
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/Vehicle.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/data.js
try { (() => {
// Nostalgia Auto Gallery — demo inventory & content (no real prices).
window.NAG = window.NAG || {};
window.NAG.PHOTOS = '../../assets/photos/';
window.NAG.STOCK = [{
  id: 'nag-180sx-typex',
  title: 'Nissan 180SX',
  subtitle: 'Type X — Fastback',
  image: '../../assets/photos/s13-front-lit.jpg',
  gallery: ['s13-front-lit.jpg', 's13-front-low.jpg', 's13-night-station.jpg', 'hero-pavilion-s13.jpg'],
  year: '1991',
  km: '142 000 km',
  gearbox: 'BVM5',
  fuel: 'Essence',
  power: '205 ch',
  price: '12 900 €',
  status: 'Disponible',
  statusTone: 'ok',
  plate: 'BX-605-HJ',
  dept: '30',
  tags: ['JDM', 'Youngtimer', 'Propulsion'],
  blurb: "Une S13 fastback préparée avec passion. Carrosserie saine, intérieur d'origine soigné, prête à prendre la route. Sélection rigoureuse — état, historique et qualité vérifiés."
}, {
  id: 'nag-180sx-turbo',
  title: 'Nissan 180SX',
  subtitle: 'Projet Turbo — Orange',
  image: '../../assets/photos/s13-engine-bay.jpg',
  gallery: ['s13-engine-bay.jpg'],
  year: '1992',
  km: '168 000 km',
  gearbox: 'BVM5',
  fuel: 'Essence',
  power: '250 ch',
  price: '16 900 €',
  status: 'Réservé',
  statusTone: 'warn',
  plate: 'AB-180-SX',
  dept: '30',
  tags: ['JDM', 'Turbo', 'Performance'],
  blurb: "Build turbo abouti : admission, intercooler, ligne. Un projet performance suivi, documenté, pour les passionnés qui veulent du caractère."
}, {
  id: 'nag-205',
  title: 'Peugeot 205',
  subtitle: 'Youngtimer — Rouge Vallelunga',
  image: '../../assets/photos/205-front.jpg',
  gallery: ['205-front.jpg', '205-rear.jpg'],
  year: '1990',
  km: '98 000 km',
  gearbox: 'BVM5',
  fuel: 'Essence',
  power: '60 ch',
  price: '4 900 €',
  status: 'Disponible',
  statusTone: 'ok',
  plate: 'EB-162-BB',
  dept: '31',
  tags: ['Youngtimer', 'Française', 'Collection'],
  blurb: "L'icône populaire des années 80. Légère, vive, attachante. Une youngtimer française à chouchouter — idéale première collection."
}, {
  id: 'nag-180sx-night',
  title: 'Nissan 180SX',
  subtitle: 'Édition Nuit — Bordeaux',
  image: '../../assets/photos/s13-night-station.jpg',
  gallery: ['s13-night-station.jpg', 's13-front-low.jpg'],
  year: '1990',
  km: '155 000 km',
  gearbox: 'BVM5',
  fuel: 'Essence',
  power: '205 ch',
  price: '11 500 €',
  status: 'Vendu',
  statusTone: 'red',
  plate: 'CD-905-NX',
  dept: '30',
  tags: ['JDM', 'Youngtimer'],
  blurb: "Vendue — un bel exemple de ce qui passe par l'atelier. Contactez-moi pour une recherche personnalisée d'un modèle équivalent."
}];
window.NAG.SERVICES = [{
  index: '01',
  title: 'Detailing',
  icon: '✦',
  description: "Soin et préparation esthétique. Un travail minutieux pour éliminer les traces du quotidien et préserver la valeur de votre véhicule.",
  bullets: ['Nettoyage approfondi intérieur & extérieur', 'Décontamination & polish', 'Protection durable des surfaces'],
  priceFrom: '149 €'
}, {
  index: '02',
  title: 'Vente',
  icon: '◆',
  description: "Achat & revente de véhicules d'occasion sélectionnés rigoureusement — attention portée à l'état, l'historique et la qualité de chaque auto.",
  bullets: ['Sélection passionnée', 'Historique vérifié', 'Reprise & dépôt-vente'],
  priceFrom: '4 900 €'
}, {
  index: '03',
  title: 'Pièces',
  icon: '⚙',
  description: "Négoce de véhicules et de pièces automobiles. Je facilite la recherche de solutions pour vos projets mécaniques.",
  bullets: ['Pièces JDM & youngtimer', 'Recherche sur demande', 'Conseil mécanique'],
  priceFrom: 'sur devis'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/data.js", error: String((e && e.message) || e) }); }

// ui_kits/vitrine/sections.jsx
try { (() => {
// Header, Footer, and shared bits for the Vitrine site.
const {
  Button,
  Badge,
  Eyebrow,
  GearRule
} = window.NostalgiaAutoGalleryDesignSystem_8df915;
const navStyles = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px clamp(16px,4vw,48px)',
    background: 'rgba(13,14,16,.86)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--border-on-dark)'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer'
  },
  word: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    textTransform: 'uppercase',
    lineHeight: .85,
    letterSpacing: '-.01em',
    color: '#fff'
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 26
  },
  link: active => ({
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 14.5,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    color: active ? '#fff' : 'var(--text-on-dark-muted)',
    cursor: 'pointer',
    position: 'relative',
    paddingBottom: 4,
    borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
    transition: 'color .2s'
  })
};
function Header({
  route,
  go
}) {
  const items = [['home', 'Accueil'], ['stock', 'Le stock'], ['services', 'Services'], ['contact', 'Contact']];
  return /*#__PURE__*/React.createElement("header", {
    style: navStyles.bar,
    className: "nag-dark"
  }, /*#__PURE__*/React.createElement("div", {
    style: navStyles.brand,
    onClick: () => go('home')
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/emblem-transparent.png",
    alt: "Nostalgia Auto Gallery",
    style: {
      height: 46
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: navStyles.word
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18
    }
  }, "Nostalgia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--red-300)',
      letterSpacing: '.06em'
    }
  }, "Auto Gallery"))), /*#__PURE__*/React.createElement("nav", {
    style: navStyles.links,
    className: "nag-desktop-nav"
  }, items.map(([r, label]) => /*#__PURE__*/React.createElement("span", {
    key: r,
    style: navStyles.link(route === r || r === 'stock' && route === 'vehicle'),
    onClick: () => go(r)
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--text-on-dark-muted)',
      letterSpacing: '.02em'
    },
    className: "nag-phone"
  }, "04 48 21 61 51"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    onClick: () => go('contact')
  }, "Devis")));
}
function SectionHead({
  eyebrow,
  title,
  intro,
  light,
  align = 'left'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: align === 'center' ? '0 auto' : 0,
      textAlign: align
    }
  }, eyebrow && /*#__PURE__*/React.createElement(Eyebrow, {
    tone: light ? 'on-dark' : 'brand'
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 'clamp(30px,3.6vw,48px)',
      lineHeight: 1.0,
      letterSpacing: '-.01em',
      margin: '14px 0 0',
      color: light ? '#fff' : 'var(--text-strong)'
    }
  }, title), intro && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 17,
      lineHeight: 1.6,
      marginTop: 14,
      color: light ? 'var(--text-on-dark-muted)' : 'var(--text-muted)'
    }
  }, intro));
}
function Footer({
  go
}) {
  return /*#__PURE__*/React.createElement("footer", {
    className: "nag-dark",
    style: {
      background: 'var(--ink-900)',
      color: 'var(--text-on-dark)',
      padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,48px) 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 40,
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/emblem-transparent.png",
    style: {
      height: 56
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      lineHeight: .85,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22
    }
  }, "Nostalgia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--red-300)'
    }
  }, "Auto Gallery"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--text-on-dark-muted)',
      margin: 0
    }
  }, "Votre partenaire passionn\xE9 pour l'automobile. Detailing, vente & pi\xE8ces \u2014 Parignargues, Gard (30) et d\xE9partements voisins.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 56,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: 'var(--text-faint)',
      marginBottom: 14
    }
  }, "Navigation"), [['home', 'Accueil'], ['stock', 'Le stock'], ['services', 'Services'], ['contact', 'Contact']].map(([r, l]) => /*#__PURE__*/React.createElement("div", {
    key: r,
    onClick: () => go(r),
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      color: 'var(--text-on-dark)',
      marginBottom: 9,
      cursor: 'pointer'
    }
  }, l))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: 'var(--text-faint)',
      marginBottom: 14
    }
  }, "Contact"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'var(--text-on-dark)',
      marginBottom: 9
    }
  }, "04 48 21 61 51"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      color: 'var(--text-on-dark)',
      marginBottom: 9
    }
  }, "contact@nostalgia-auto.fr"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14.5,
      color: 'var(--text-on-dark-muted)'
    }
  }, "Parignargues, 30730")))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '40px 0 24px'
    }
  }, /*#__PURE__*/React.createElement(GearRule, {
    mark: "\u25C6 \u25C6 \u25C6",
    tone: "dark"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: 'var(--text-faint)',
      letterSpacing: '.04em',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Nostalgia Auto Gallery"), /*#__PURE__*/React.createElement("span", null, "OPSC \xB7 Detail & Performance"))));
}
Object.assign(window, {
  Header,
  Footer,
  SectionHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vitrine/sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ServiceCard = __ds_scope.ServiceCard;

__ds_ns.SpecGrid = __ds_scope.SpecGrid;

__ds_ns.VehicleCard = __ds_scope.VehicleCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.GearRule = __ds_scope.GearRule;

__ds_ns.PlateTag = __ds_scope.PlateTag;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Select = __ds_scope.Select;

})();
