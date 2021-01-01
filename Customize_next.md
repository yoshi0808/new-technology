# Customize NEXT Theme



## Make My css folder,Make Custome CSS file

./new-technology/themes/next/source/css

 make folder "_my"

Make file mycss.styl in "_my"

### import mycss.styl

./new-technology/themes/next/source/css/

main.styl

#### add some lines below

//My Layer
//--------------------------------------------------
@import "_my/mycss";

## Change some files in components/post folder

./new-technology/themes/next/source/css/_common/components/post

post-body.styl

1. change h1-h6 styles and ul li style

   // h1, h2, h3, h4, h5, h6 {
     //   padding-top: 10px;
     //
     //   // Supported plugins: hexo-renderer-markdown-it hexo-renderer-marked
     //   .header-anchor, .headerlink {
     //     border-bottom-style: none;
     //     color: inherit;
     //     float: right;
     //     font-size: $font-size-small;
     //     margin-left: 10px;
     //     opacity: 0;

     //     &::before {
     //       font-family-icons('\f0c1');
     //     }
     //   }

     //   &:hover {
     //     .header-anchor, .headerlink {
     //      opacity: .5;

     //      &:hover {
     //         opacity: 1;
     //       }
     //     }
     //   }
     // }

     h2 {
       position: relative;
       background: #f1f8ff;
       padding: 0.5em 0.5em;
       border-left: solid 2em #5c9ee7;
     }

     h2:before {
       position: absolute;
       content: "\f303";
       padding: 0em;
       color: white;
       font-weight: 900;
       left: -1.35em;
       top: 50%;
       -webkit-transform: translateY(-50%);
       transform: translateY(-50%);
     }

     h3 {
       position: relative;
       padding: 0.5em 0.5em;
       color: #39a38d;/* フォント色 */
     }

     h3:before {
       position: absolute;
       content: "";
       display: block;
       width: 100%;
       height: 4px;
       background: repeating-linear-gradient(90deg, #3EAF36 0%, #369fad 20%, rgb(171, 97, 80) 50%, rgb(160, 173, 54) 100%);
       bottom: 0;
       left: 0;
       z-index: 0;
     }

     h4 {
         position: relative;
         margin: 2em 0em 0.5em 0.5em;
         padding: 0em 0.5em;
         padding-left: 1.4em;
         line-height: 1.4;
         color:#17b7b1;/*フォント色*/
     }

     h4:before {
       position: absolute;
       content: "\f00c";
       font-weight: 900;
       font-size: 1em;
       left: 0;
       color: #17b7b1;
     }

2. // Customize ul,li 

    ul {
     border: solid 2px skyblue;
     border-radius: 5px;
     margin 1.5em 0;
     padding: 0.5em 2em 0.5em 2.3em;
     position: relative;
   }

   ul li {
     line-height: 1.5;
     padding: 0.5em 1.5em;
     list-style-type: none!important;
   }

   ul li:before {
     font-family: $font-icons;
     content: "\f138";/*アイコンの種類*/
     font-size: $font-size-medium;
     font-weight: 900;
     position: absolute;
     left : 1em;/*左端からのアイコンまでの距離*/
     color: skyblue;/*アイコン色*/
   }

post-header.styl

Make change link color blue to text

1.make change below

​	.posts-expand .post-title-link {
  	border-bottom: 0;
  	// color: var(--link-color);
  	color: var(--text-color);

  &::before {
    //background: var(--link-color);
    background: var(--text-color);

## Change some files in scaffolding folder

./new-technology/themes/next/source/css/_common/scaffolding/tags

label.styl

make under line in pink

      // background: $label[$type];
      background: linear-gradient(transparent 60%, #ff99ff 60%);


./new-technology/themes/next/source/css/_common/scaffolding/

base.styl

Use font awesome and change margin

h1, h2, h3, h4, h5, h6 {
  // font-family: $font-family-headings;
  font-family: "Font Awesome 5 Free",$font-family-headings;
  font-weight: bold;
  line-height: 1.5;
  // margin: 20px 0 15px;
  // margin: 20px 0 15px;
  margin: 50px 0 20px;
}

Pagination.styl

Change page number color from blue to black

$page-number-basic {
  // add 1 line
  color: var(--text-color);
  display: inline-block;
  margin: -1px 10px 0;
  padding: 0 10px;

  +mobile() {
    margin: 0 5px;
  }
}

## Change some files in _variables folder

./new-technology/themes/next/source/css/_variables

base.styl

### Change color

// $black-light  = #555;
$black-light  = #444;
$black-dim    = #333;
$black-deep   = #222;
$red          = #ff2a2a;
$blue-bright  = #87daff;
// $blue         = #0684bd;
// $blue         = #1d3994;
$blue         = #0066cc;

/ Global link color.
//$link-color                   = $black-light;
$link-color                   = $blue;
$link-color-dark              = $grey-light;
// $link-hover-color             = $black-deep;
$link-hover-color             = $blue;

### Font style

// Font families.
// $font-family-chinese      = "PingFang SC", "Microsoft YaHei";
$font-family-chinese         = -apple-system,BlinkMacSystemFont,Robot,"Helvetica Neue",YuGothic,"メイリオ",Meiryo,"PingFang SC";

// $font-family-base         = $font-family-chinese, sans-serif;
// $font-family-base         = get_font_family('global'), $font-family-chinese, sans-serif if get_font_family('global');
$font-family-base         = "Helvetica Neue", Arial,"Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", Meiryo, sans-serif;

$font-family-logo         = $font-family-base;
$font-family-logo         = get_font_family('title'), $font-family-base if get_font_family('title');

$font-family-headings     = $font-family-base;
$font-family-headings     = get_font_family('headings'), $font-family-base if get_font_family('headings');

$font-family-posts        = $font-family-base;
$font-family-posts        = get_font_family('posts'), $font-family-base if get_font_family('posts');

// $font-family-monospace    = consolas, Menlo, monospace, $font-family-chinese;
// $font-family-monospace    = get_font_family('codes'), consolas, Menlo, monospace, $font-family-chinese if get_font_family('codes');
$font-family-monospace    = Menlo, Consolas, monospace, $font-family-base;

//Add Icon families.
$font-icons              = "Font Awesome 5 Free";

### Font size

// $font-size-smallest       = .75em;
// $font-size-smaller        = .8125em;
// $font-size-small          = .875em;
// $font-size-medium         = 1em;
// $font-size-large          = 1.125em;
// $font-size-larger         = 1.25em;
// $font-size-largest        = 1.5em;

$font-size-smallest       = .75em;
$font-size-smaller        = .8125em;
$font-size-small          = .875em;
$font-size-medium         = 0.95em;
$font-size-large          = 1.068em;
$font-size-larger         = 1.18em;
$font-size-largest        = 1.5em;

// Global line height
// $line-height-base         = 2;
// $line-height-code-block   = 1.6; // Can't be less than 1.3;
$line-height-base         = 1.75;
$line-height-code-block   = 1.5; // Can't be less than 1.3;