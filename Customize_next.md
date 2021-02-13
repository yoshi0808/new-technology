# Customize NEXT Theme

## avator and icons

copy avator and favicon
/next/source/images
*-next.png (3 files)
yoshi.png

## modify japanese comment
/next/language/ja.yml

modify below;
license_content: "このブログ内のすべての記事は、特別な記載がない限り %s の下のライセンスで保護されています。また、免責事項・プライバシーポリシーについては、メニューのディスクレーマーをご覧ください。"

add disclaimer
 disclaimer: ディスクレーマー

## changes manually

Pagination.styl must modify manuyally

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


 /next/source/css/_common/outline/header/menu.styl must modify manually
 a {
    // add 1 line
    color: var(--text-color);
    border-bottom: 0;
    display: block;
    font-size: $font-size-smaller;
    transition: border-color $transition-ease;

    &:hover, &.menu-item-active {
      // add 2 line
      color: var(--text-color);
      font-weight: bold;
      background: var(--menu-item-bg-color);
    }
  }

