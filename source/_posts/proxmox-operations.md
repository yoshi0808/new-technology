---
title: 自宅のProxmoxクラスタ、AIに運用させる前に何を用意したか
date: 2026-08-29T10:19:46+09:00
tags:
 - proxmox
 - UniFi
categories:
 - AI
 - Ansible
 - Network

---

{% asset_img Title.png alt %}

## AIエージェントに本番サーバの鍵を渡すのをやめました

「本番には触るな」とプロンプトには書いていました。ハーネスで止めても、AIエージェントが誤って（迂回して）本番へ触ろうとしたことが何度かあり、そのたびに文章を書き足しました。書き足せば書き足すほど、守られない文章が増えていく感覚がありました。

最終的にやったのは、文章を足すことではなく、`~/.ssh/` から鍵ファイルそのものを削除することでした。届かなくなったので、結果的に守れるようになったわけです。

——という運用を、自宅のProxmoxクラスタで行っています。この記事ではまず、その「運用されている側」、つまり何がどう動いているのかを紹介します。AIに任せるための設計そのものは、次回以降でまとめる予定です。

<!-- more -->

## 何を運用しているか

まずは全体の構成から見ていきます。以降の図やplaybookには、私が付けたホスト名がそのまま出てきます。先に一覧にしておきます。

| ホスト名        | 役割                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `pve1` / `pve2` | Proxmox VEクラスタを構成する物理ノード                                                                    |
| `quory`         | クラスタ**外**に置いた制御ノード。QDevice(2ノードクラスタの投票役)と、後述するAnsible本番実行環境を兼ねる |
| `sophos-fw`     | ファイアウォール兼DNS。クラスタ上で動くVM                                                                 |
| `authy`         | FreeRADIUS(WPA3 Enterprise認証用)                                                                         |
| `monnie`        | 監視スタック(Prometheus / Grafana / Loki)が動くVM                                                         |
| `sandbox`       | 使い捨ての検証用VM                                                                                        |
| `ansy`          | Ansibleの開発・編集を行う環境。本番(`quory`)へは接続できない                                              |

QDeviceについては後ほど詳しく触れますが、簡単に言うと「2台構成のProxmoxクラスタで、どちらかのノードが落ちてももう一方が正常に動き続けられるように、第3の投票権を持たせておく仕組み」です。`quory` がその役割を担っています。

それでは構成図です。

{% mermaid flowchart TB %}

    NET([インターネット])
    subgraph rack["自宅ラック"]
        subgraph pvecluster["Proxmox VE クラスタ"]
            PVE1["pve1"]
            PVE2["pve2"]
        end
        QUORY["quory<br/><small>制御ノード / クラスタ外</small>"]
        SW["UniFi スイッチ"]
        AP["UniFi AP"]
        CK["CloudKey<br/><small>UniFi コントローラ</small>"]
        NAS[("Synology NAS<br/><small>バックアップ</small>")]
    end
    FW["sophos-fw<br/><small>ファイアウォール(VM)</small>"]

    NET --> PVE1
    NET --> PVE2
    PVE1 -.ホスト.-> FW
    PVE2 -.ホスト.-> FW
    FW --> SW
    SW --- AP
    SW --- CK
    SW --- PVE2
    SW --- QUORY
    SW --- NAS

{% endmermaid %}


この構成で一番面白いのは、ファイアウォール(`sophos-fw`)がクラスタ上のVMだという点です。インターネットとの境界そのものが、自分がパッチを当てる対象の上に乗っています。だから、後述するパッチ運用はかなり慎重に設計しています。

WANの引き込みもpve1・pve2の両方に来ており、ファイアウォールはHAで動いているため、通常はpve1側で稼働していても、フェイルオーバーが起きればpve2側に移って動き続けます。つまり境界そのものが「固定された場所」ではなく「動く」設計になっているということです。

もう一点、`quory` がクラスタの**外**にいることも意図的です。クラスタを止める作業の制御点が、止める対象の上に乗っていてはいけないと考えたためです。



{% mermaid flowchart TB %}

    subgraph cluster["Proxmox VE クラスタ"]
        FW["sophos-fw<br/><small>ファイアウォール・DNS</small>"]
        AUTHY["authy<br/><small>FreeRADIUS</small>"]
        MONNIE["monnie<br/><small>Prometheus / Grafana / Loki</small>"]
        SANDBOX["sandbox<br/><small>使い捨て検証用</small>"]
    end
    QUORY["quory<br/><small>制御ノード + QDevice</small>"]
    QUORY -.->|"corosync-qnetd<br/>(2ノードのquorum成立)"| cluster

    classDef ha fill:#2d6a4f,stroke:#40916c,color:#fff
    class FW,AUTHY ha
{% endmermaid %}

緑色になっているのがHA管理対象(`sophos-fw` / `authy`)で、ノードの保守時には自動で反対側のノードへ移動します。一方、`monnie`(監視スタック)と `sandbox`(検証用)はHA対象外です。

2ノード構成のProxmoxクラスタは、そのままだと片方のノードが落ちた際にquorumを失ってしまいます。そこで `quory` を `corosync-qnetd` として第3の投票者にしています。制御ノードをクラスタの外に置いた理由は、この点にも表れています。

正直に書くと、冗長化の度合いにはばらつきがあります。`authy`(RADIUS)はソフトウェア自体をクラスタリングしているわけではありませんが、VMとしてProxmoxのHA管理下にあるため、ノード障害時には自動的に反対側のノードへ移動します。つまりインフラ層での冗長化は効いている、ということです。一方で `monnie`(監視スタック)はHA対象外のため、こちらは正直に単一障害点として残っています。これは意図的な割り切りで、監視ログを最後まで残すためにあえてフェイルオーバーさせない設定にしています。家庭向けの構成としてクリティカルなサービスそのものを持たせているわけではなく、あくまで監視専用のノードなので、可用性よりもログの一貫性を優先した形です。個人のホームラボとしてはそれなりに本格的な作りだと思いますが、すべてが均等に冗長化されているわけではありません。

## 観測 — ログとメトリクスの集約

障害や異常を追うための観測パイプラインは、`monnie` という1台のVMに集約しています。

{% mermaid flowchart LR %}
    subgraph sources["送信元"]
        UNIFI["UniFiスイッチ / AP<br/><small>GUI設定</small>"]
        CK["UniFi Controller<br/><small>CloudKey</small>"]
        UBUNTU["Ubuntuホスト<br/><small>rsyslog(Ansible管理)</small>"]
        PVE["Proxmox<br/><small>rsyslog(手動)</small>"]
    end
    subgraph monnie["monnie"]
        RSYS["rsyslog receiver"]
        JOURNAL["local journal"]
        ALLOY["Grafana Alloy"]
        LOKI[("Loki")]
        PROM[("Prometheus")]
        UNPOLLER["unpoller"]
        GRAFANA["Grafana"]
    end
    SLACK["Slack"]

    UNIFI -->|syslog| RSYS
    CK -->|syslog| RSYS
    CK -->|API| UNPOLLER
    UBUNTU -->|syslog| RSYS
    PVE -->|syslog| RSYS
    RSYS --> ALLOY
    JOURNAL --> ALLOY
    ALLOY --> LOKI
    UNPOLLER --> PROM
    LOKI --> GRAFANA
    PROM --> GRAFANA
    GRAFANA -->|"アラート<br/>(例: スイッチのPacket Error/Drop)"| SLACK
{% endmermaid %}

工夫している点は、Lokiへ書き込むのはAlloyだけに絞っていることです。送信元はUniFi機器・Ubuntuホスト・Proxmoxとバラバラですが、書き手を1つに統一することで、ログの流れを追いやすくしています。

メトリクス面では、UniFi Controller(CloudKey)のAPIからUniFi Poller (`unpoller` )がメトリクスを取得し、Prometheusへ取り込んでいます。ここで実際に運用に活きているのが、スイッチポートのPacket Error / Dropの監視です。Grafana側でこれを検知した場合はSlackへ通知するようにしていて、ケーブルの劣化やポートの異常といった、普段は気づきにくい物理層のトラブルの早期発見に役立っています。

管理の仕方は正直、層によってバラバラです。monnie上のreceiverとAlloyはAnsibleで管理、Ubuntu側のsyslog送信設定もAnsibleで統一しています。一方でProxmoxのsyslog送信は手動設定、UniFi機器やSophos Firewallなどのアプライアンス類は各自のGUIで設定しています。「全部IaC(Infrastructure as Code)」というきれいな状態ではなく、現実的な範囲で整えている、という状況です。

余談ですが、CloudKeyのログはCEF形式で `level` フィールドを持たないため、Grafana側の既定フィルタ(warning/error)から漏れてしまい、「ログが来ていない」ように見えたことがありました。実際にはパイプライン自体は健全に動いていて、単にフィルタの条件に引っかからなかっただけ、というオチです。こういう「動いているのに動いていないように見える」トラブルは、監視を組んでいると意外とよく出会います。

## 運用の中身

ここでは代表的な運用を3つ、実際に起きたことも含めて紹介します。

### ヘルスチェック — 全ての出発点

最初に作ったのがこのヘルスチェックでした。Proxmox・RADIUS・監視スタックそれぞれに対して、日次で状態を確認しています。

設計で意識しているのは、shellスクリプト側は観測だけを行い、判定はAnsible側で行うという役割分担です。shellに閾値判定まで持たせてしまうと、後になって「なぜこの値でアラートが上がったのか」を追いにくくなってしまうためです。

また、正常時はあえて通知しないようにしています。ただし「通知が来ないこと」自体を、実行が成功した根拠にはしていません。実行されたかどうかは、`quory`上のSemaphoreUIのジョブ履歴で別途確認するようにしています。「通知がない=正常」という思い込みは、ジョブそのものが動いていなかった場合に気づけなくなるリスクがあるからです。

### 証明書管理 — 家庭内PKI

最近はフィッシング対策等でパスキー全盛となり、サーバーの正当性確認が従来以上に求められています。内部サービス向けに、私設のCA(認証局)で証明書を発行・配布しています。ここで言う「証明書」はWebサーバー向けだけの話ではありません。VPNやRADIUS(EAP-TLS認証)も含めて、社内、もとい家庭内で使う証明書はすべて同じRoot CAを起点にしています。各ノードに配置しているのは、Root CA自身ではなく、そこから発行した中間CAです。Root CAの秘密鍵は普段オンラインの場所には置かず、外部ストレージに保管しています。

この構成にしている理由は運用の単純さです。スマートフォンやPCには、Root CAをたった1つ登録しておくだけで、Webサーバー、VPN、RADIUSなど、家庭内のあらゆるサービスの証明書を検証できるようになります。RADIUS側から見ても恩恵は大きく、クライアント端末が増えるたびに何か設定を追加する必要はなく、サーバー側にRoot CAから署名されたサーバー証明書さえ置いておけば、あとはほぼ放っておける状態になります。

週次で有効期限を確認し、残り15日を切ったタイミングで各サービスの証明書(中間CAから発行しているもの)を更新する運用です。

ここで一つ、実際にあった落とし穴を紹介します。「ROOT CAを配っているつもり」で運用していたところ、実は配布していたのは中間CAだったことに後から気づきました。ファイル名が `home-tls-ca.crt` となっていて、いかにもROOTらしい名前だったのが原因です。証明書はファイル名ではなく、subjectやissuerといった中身で確認しなければならない、という教訓を得ました。

なお、証明書更新作業で使うCAの秘密鍵はtmpfs上にのみ展開し、作業が終わったら消すようにしています。ディスク上に平文で残さないための最低限の配慮です。

### パッチ管理 — 無停止ローリング

週次でdry-runを実行し、実際の適用は別のタイミングで行っています。適用時は対象ゲストを反対側のノードへ退避 → パッチ適用 → 再起動 → ヘルスチェック → 復帰、という流れです。

この話は掘り下げると長くなるので今回は1段落にとどめますが、一点だけ触れておきます。ノード移動中は監視をmute(一時停止)していますが、ファイアウォールの再起動中もアラートは止まってしまいます。だからこそ、muteのTTL(有効時間)は慎重に決めています。パッチ運用の詳細は、また別の記事でまとめる予定です。

## 制御平面 — 誰がplaybookを流すのか

最後に、この記事の本題である「誰が本番へplaybookを流すのか」という部分です。

{% mermaid flowchart LR %}
    subgraph dev["開発 (ansy)"]
        EDIT["編集・レビュー・検証"]
    end
    GIT[("GitHub<br/><small>確定済みコードの正本</small>")]
    subgraph prod["本番 (quory)"]
        PULL["1分ごとに pull"]
        SEMA["Semaphore<br/><small>GUI / 定期実行</small>"]
    end
    TARGETS["pve1 / pve2 / authy / monnie / …"]

    EDIT -->|"push<br/>(人間の承認が要る)"| GIT
    GIT -->|"git pull --ff-only"| PULL
    PULL --> SEMA
    SEMA -->|"実行"| TARGETS
    EDIT -.->|"✕ 鍵を持たない<br/>(到達できない)"| TARGETS

    linkStyle 4 stroke:#c0392b,stroke-width:2px
{% endmermaid %}

開発機である `ansy` は、本番へは物理的に届きません。接続に必要な鍵を持っていないためです。コードは必ずGitHubを経由してのみ本番へ渡る仕組みになっています（※厳密には全く鍵を持っていないことは無いのですが明確な制限付きのものだけです）。

本番での実行はSemaphoreUIから行います。定期実行のジョブが登録されていて、それぞれのplaybook名には `SAFE:` / `SEMI-SAFE:` / `UN-SAFE:` といった危険度のプレフィックスを付けています。数はある程度あり、今後も増減する見込みなので、正確な本数はrepoの `playbooks/README.md` をご覧いただければと思います。

そして、冒頭の「鍵を消した」という話は、この図の点線の×印のことです。AIエージェントに「本番には触るな」という文章をいくら書き足しても、それは規範上の制約にすぎません。物理的に鍵を持たせない、届かなくする、という構造そのもので制約をかける方が、少なくとも私にとっては安心できる設計でした。

なぜそこまでするのか、という話は、次回の記事でAIに運用を任せるための設計として詳しく書きたいと思います。

## 次回予告

次回は、AIに実際の運用を任せるための設計について書く予定です。境界をどう作るか、異なるAIによる相互レビューの仕組み、月次での人間によるレビューなど、この記事では触れなかった部分を掘り下げます。

また、その次の回では、Proxmoxの無停止ローリングアップデートの詳細についてもまとめる予定です。

構成に登場したplaybookは、リポジトリで公開しています。一覧は `playbooks/README.md` にカタログとしてまとめてありますので、興味のある方はご覧ください。

https://github.com/yoshi0808/homelab-ansible

このリポジトリは全てAI（ClaudeCode,Codex）で生成しています。正直なところ、個人のホームラボとしてはやや大掛かりな構成だと思います。ただ、最初から今の形だったわけではなく、証明書の勘違いのような失敗を重ねながら少しずつ直してきたものです。そのあたりの試行錯誤も、リポジトリの `docs/ai/knowledge/incidents/` に記録として残しています。次回以降の記事とあわせて、興味があれば覗いてみてください。