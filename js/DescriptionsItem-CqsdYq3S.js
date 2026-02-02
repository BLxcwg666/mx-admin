import{b8 as b,b4 as e,bN as V,b6 as S,b5 as B,bO as F,bP as G,d as E,bQ as H,b9 as n,bR as K,bS as Q,bj as U,bk as L,bT as W,a5 as M,bo as T,bp as q,bU as J}from"./index-8rGOX08P.js";function _(r,p="default",a=[]){const{children:i}=r;if(i!==null&&typeof i=="object"&&!Array.isArray(i)){const l=i[p];if(typeof l=="function")return l()}return a}const X=b([e("descriptions",{fontSize:"var(--n-font-size)"},[e("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[e("descriptions-table-header",{padding:"var(--n-th-padding)"}),e("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),V("bordered",[e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[b("&:last-child",[e("descriptions-table-content",{paddingBottom:0})])])])])]),S("left-label-placement",[e("descriptions-table-content",[b("> *",{verticalAlign:"top"})])]),S("left-label-align",[b("th",{textAlign:"left"})]),S("center-label-align",[b("th",{textAlign:"center"})]),S("right-label-align",[b("th",{textAlign:"right"})]),S("bordered",[e("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[e("descriptions-table",[e("descriptions-table-row",[b("&:not(:last-child)",[e("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),e("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[b("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-content",[b("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),e("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),e("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[e("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[e("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[e("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),e("descriptions-table-content",`
 vertical-align: top;
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-td-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[B("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),B("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),F(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),G(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),N="DESCRIPTION_ITEM_FLAG";function Y(r){return typeof r=="object"&&r&&!Array.isArray(r)?r.type&&r.type[N]:!1}const Z=Object.assign(Object.assign({},L.props),{title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:{type:String,default:"medium"},bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]}),te=E({name:"Descriptions",props:Z,slots:Object,setup(r){const{mergedClsPrefixRef:p,inlineThemeDisabled:a}=U(r),i=L("Descriptions","-descriptions",X,W,r,p),l=M(()=>{const{size:d,bordered:h}=r,{common:{cubicBezierEaseInOut:g},self:{titleTextColor:C,thColor:P,thColorModal:t,thColorPopover:z,thTextColor:v,thFontWeight:$,tdTextColor:R,tdColor:k,tdColorModal:A,tdColorPopover:o,borderColor:f,borderColorModal:I,borderColorPopover:c,borderRadius:m,lineHeight:y,[T("fontSize",d)]:w,[T(h?"thPaddingBordered":"thPadding",d)]:u,[T(h?"tdPaddingBordered":"tdPadding",d)]:x}}=i.value;return{"--n-title-text-color":C,"--n-th-padding":u,"--n-td-padding":x,"--n-font-size":w,"--n-bezier":g,"--n-th-font-weight":$,"--n-line-height":y,"--n-th-text-color":v,"--n-td-text-color":R,"--n-th-color":P,"--n-th-color-modal":t,"--n-th-color-popover":z,"--n-td-color":k,"--n-td-color-modal":A,"--n-td-color-popover":o,"--n-border-radius":m,"--n-border-color":f,"--n-border-color-modal":I,"--n-border-color-popover":c}}),s=a?q("descriptions",M(()=>{let d="";const{size:h,bordered:g}=r;return g&&(d+="a"),d+=h[0],d}),l,r):void 0;return{mergedClsPrefix:p,cssVars:a?void 0:l,themeClass:s?.themeClass,onRender:s?.onRender,compitableColumn:J(r,["columns","column"]),inlineThemeDisabled:a}},render(){const r=this.$slots.default,p=r?H(r()):[];p.length;const{contentClass:a,labelClass:i,compitableColumn:l,labelPlacement:s,labelAlign:d,size:h,bordered:g,title:C,cssVars:P,mergedClsPrefix:t,separator:z,onRender:v}=this;v?.();const $=p.filter(o=>Y(o)),R={span:0,row:[],secondRow:[],rows:[]},A=$.reduce((o,f,I)=>{const c=f.props||{},m=$.length-1===I,y=["label"in c?c.label:_(f,"label")],w=[_(f)],u=c.span||1,x=o.span;o.span+=u;const O=c.labelStyle||c["label-style"]||this.labelStyle,j=c.contentStyle||c["content-style"]||this.contentStyle;if(s==="left")g?o.row.push(n("th",{class:[`${t}-descriptions-table-header`,i],colspan:1,style:O},y),n("td",{class:[`${t}-descriptions-table-content`,a],colspan:m?(l-x)*2+1:u*2-1,style:j},w)):o.row.push(n("td",{class:`${t}-descriptions-table-content`,colspan:m?(l-x)*2:u*2},n("span",{class:[`${t}-descriptions-table-content__label`,i],style:O},[...y,z&&n("span",{class:`${t}-descriptions-separator`},z)]),n("span",{class:[`${t}-descriptions-table-content__content`,a],style:j},w)));else{const D=m?(l-x)*2:u*2;o.row.push(n("th",{class:[`${t}-descriptions-table-header`,i],colspan:D,style:O},y)),o.secondRow.push(n("td",{class:[`${t}-descriptions-table-content`,a],colspan:D,style:j},w))}return(o.span>=l||m)&&(o.span=0,o.row.length&&(o.rows.push(o.row),o.row=[]),s!=="left"&&o.secondRow.length&&(o.rows.push(o.secondRow),o.secondRow=[])),o},R).rows.map(o=>n("tr",{class:`${t}-descriptions-table-row`},o));return n("div",{style:P,class:[`${t}-descriptions`,this.themeClass,`${t}-descriptions--${s}-label-placement`,`${t}-descriptions--${d}-label-align`,`${t}-descriptions--${h}-size`,g&&`${t}-descriptions--bordered`]},C||this.$slots.header?n("div",{class:`${t}-descriptions-header`},C||Q(this,"header")):null,n("div",{class:`${t}-descriptions-table-wrapper`},n("table",{class:`${t}-descriptions-table`},n("tbody",null,s==="top"&&n("tr",{class:`${t}-descriptions-table-row`,style:{visibility:"collapse"}},K(l*2,n("td",null))),A))))}}),ee={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]},re=E({name:"DescriptionsItem",[N]:!0,props:ee,slots:Object,render(){return null}});export{te as N,re as a};
