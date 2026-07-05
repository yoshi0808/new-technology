---
title: Proxmox運用にAnsibleとAIを活用する：ホームラボ構成管理の始め方
date: 2026-07-05T14:26:27+09:00
tags: proxmox
categories: 
---

{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

これまでの記事では、2台のProxmoxノード（V9.x）でクラスタを構成し、VMオンラインマイグレーションとフェイルオーバーの検証を実施しました。ここだけ見るととても素敵な機能ですが、普段からはその管理が必要になります。

一昔前であれば問題が起きたら対処する、自宅の環境なら責任もないですし、最悪はネットが使えれば良い、PCが1台あれば事足りる。そのレベルでも良かった時代でした。私もESXiの1台で運用していた時は、それが壊れたら壊れたなりにネットを回復すればそれでOKとしていたのも事実です。

Proxmoxになり、せっかくクラスター構成という安心感が得られるようになったことは良いのですが、運用が一段難しくなったのは事実です。
しかし、その難しさについてはAIの台頭によってカバーできるようになりました。
逆に言えば、さほど難しいことはわからなくてもAIがカバーしてくれることで、本来難しかった運用も楽になるとも言えます。

今回は運用を楽にするAnsible＋AIの紹介です。

<!-- more -->

## Ansibleについて

Ansible自体は以前からある技術です。主に、複数のサーバーを同じ方針で管理するために使われてきた構成管理ツールです。例えば同じ目的を持った複数のサーバーに対してどのハードウェアにも同じように処理をする、パッチも同様に適用するなど、物によって構成が異なる、これを構成ドリフトと言いますが、そういったことを未然防止するために使われているソフトウェアです。派手な要素は全くありません。もちろん、最初から保有しているコマンド群、暗号化する機能もありますが、大きく効率を向上させる物ではなく、ルールを明確にし、最終結果が常に同じであることを保証するために用いられる物です（サーバー保有台数が多い法人では実はそれが一番効率が高いのですが）。

Ansibleは以下のようなツリー構造になっています。Ansibleは、単体で何かを自動判断して動くソフトウェアではありません。inventoryに対象ノードを定義し、playbookに実行したい処理を書き、その処理を対象ノードへ流し込む道具です。ノードをinventoriesに定義し、playbooksで実行したいタスクを記述する、そして詳細ロジックはrolesに書く（具体的な動作をするシェル）というシンプルなものです。

``` bash
homelab-ansible/
├── ansible.cfg
├── inventories/
│   ├── homelab/
│   │   ├── group_vars/
│   │   │   ├── all.yml
│   │   ├── host_vars/
│   │   │   ├── pve1.yml
│   │   │   ├── pve2.yml
│   │   └── hosts.yml
│   └── vars/
│       ├── mail.yml
│       └── slack.yml
├── playbooks/
│   ├── proxmox_healthcheck.yml
│   ├── proxmox_hw_check.yml
└── roles/
    ├── proxmox_hw_check/
    │   ├── defaults/
    │   │   └── main.yml
    │   ├── files/
    │   │   └── proxmox-hw-check.sh
    │   └── tasks/
    │       └── main.yml
    ├── radius_healthcheck/
    │   ├── defaults/
    │   │   └── main.yml
    │   ├── files/
    │   │   └── radius-healthcheck.sh
    │   └── tasks/
    │       └── main.yml
```

## ホームラボでAnsibleが広がりにくかった理由

ホームラボでも単に複数台のWindowsなどのクライアントマシンを動作させるという目的ならばAnsibleはそもそも不要です。目的が複数台になるベアメタルの台数を減らすことが目的であり、サーバー構成を統一するという観点とは少し異なります。
それ以外では、NASや様々なプロダクトのサーバー群は、単独で動かすことも多く、複数ノードで共通のコマンドというものは少ないです。2台、3台程度のサーバー、またそれぞれの種類が異なるのであれば、SSHでログインしてそれぞれのプロダクトのコマンドを実行した方が早い場面も多いからです。しかし、Proxmoxクラスタ、qdevice、HA、ZFSレプリケーション、Firewall、監視基盤といった要素が増えてくると、コマンドを覚えるのも大変であり、手作業だけでは確認漏れが起きやすくなります。パッチも気が向けば適用するという運用が常態化しますが、それでもインターネットから直接接続されない環境下でありセキュリティ意識が高くなくてもそれなりに問題が出なかったという背景があると思います。

## シェルスクリプトでもできる、でも続かない

Ansibleではビルトインされているコマンド群もありますが、結局は自分で作ることが多くなります。これはAnsibleが広がりにくかった点ともつながるのですが、対応するコマンドがあるのか調べて、尚且つそれが保守されているのかまでを見るなら作ったほうが早いというのもあります。そして、結果としてコマンド群を纏めたラッパーシェルを作るくらいに留まります。そして、数ヶ月に1度、気が向いたらパッチを適用するという運用は昨今のサイバー攻撃を踏まえると非常に危ういです。Wi-Fiルーターも流石に今は自動更新がデフォルトとなっていますが、自宅のサーバー群は結局パッチ適用も不十分、バックアップも不十分、X（旧Twitter）を見ていると、壊れたり、不具合が発生したら作り直し、というのが大多数ではないかなと思います。ホームラボなので、それで良いとリスク受容しているわけなので、それはそれで他人には迷惑をかけない事ですし、人それぞれという結論になるのでしょう。

## シェルとAnsibleとの比較

| **観点**   | **シェル**                 | **Ansible**              |
| ---------- | -------------------------- | ------------------------ |
| 単発確認   | 早い                       | やや重い                 |
| 複数ノード | ループやSSH制御が必要      | inventoryで管理          |
| 結果の整理 | 自作が必要                 | task単位で分かる         |
| 冪等性     | 自分で作り込む             | 書き方で担保しやすい     |
| 拡張       | スクリプトが肥大化しやすい | role化しやすい           |
| AIとの相性 | ロジックが隠れやすい       | YAMLで意図を説明しやすい |

## AIがあると構成管理のハードルが下がる

Playbookの雛形作成、エラー調査、冪等（べきとう）性※の確認、危険な処理のレビュー、手順書との整合確認などをAIに任せることで、個人環境でも構成管理に踏み込みやすくなります。
※システムで一般的に使われるのは、更新が入っても何度実行しても同じ結果が保証されていること

特に、ホームユーザーには冪等性という考え方は馴染みがないと思います。当たり前のことですが、パッチを2回適用したら壊れたというのでは困ります。本番稼働前に事前確認はするが実際の更新はしないというモード（dry-run）もコマンドの種類によってはあります。
ホームユーザーには馴染みが比較的あると思われる、SSDのTrim(fstrim)コマンド、これは何度実行しても無害ではありますが、このオプションには--dry_runを引数に持つことで、実際に開放予定の容量を把握できます。ubuntuなどは定期的なtrimは予めスケジューリングされていますが、こういった内容を理解して定期的に実行すると運用に強い環境が出来上がります。

## AnsibleとAIの役割分担

実際にサーバー運用に詳しくなくても、どのようなコマンドを叩けば良いかをAIに作ってもらうことができます。純粋なソフトウェアの開発はその目的を把握することがAIにとっても難しいのですが、運用管理はおおよそ安全に運用することが目的であるため、AIの理解も十分あります。

Ansibleはplaybookというものを作り、それを実行します。どういったノードを保有しているのかはInventoryで予め登録する必要があります。そのノードに対してどんなPlaybookを実行したいのかを予めAIに渡すと、期待通りのplaybookを作ってくれます。私の環境では、Proxmoxや各種アプライアンス固有の確認が多いため、実処理の一部はシェルとして実装しています。その中身はRolesに構築します。シェルだけではなくPythonになるかもしれません。AIがAnsibleに向いていると思うのは以下の点です。

- 固有のプロダクトの知識があるので、使っているPort番号や挙動から、ユーザーがどう監視したいのかがAIも理解しやすい
- AIがAnsible構成全体を俯瞰するので、一度作成したRoleを再利用しやすい
- 予め必要とするソフトウェアを少なくしてほしいと要件を作っておけば、無駄に`sudo apt install`をしない

なお、AnsibleはこういったLinuxなどを中心として動作させるものなので、AIを使うといってもチャット型のアプリケーションではなく、コマンドライン（CLI）を使います。OpenAIのChatGPTであれば、Codex、AnthropicのClaudeであればClaudeCodeです。AIのCLIツールを本格的に使う場合は、基本的には有料プランの利用を前提に考えた方がよいと思います。料金や利用条件は変わるため、最新情報は公式サイトで確認してください。

## 私の環境での構成

- ansy: Ansible開発環境
- pve1 / pve2: Proxmoxノード
- quory: qdevice / 管理補助 / Ansible実行環境
- GitHub: Playbook管理
- AI: 設計・レビュー・エラー調査

{% asset_img architecture.png 1024 alt %}

私の環境では、まずAnsible開発環境でAIと対話しながらAnsibleコードを構築します。ここではgit管理は必須です。AIが意図しない変更を加えたりする可能性があるので、いつでも戻れるようにしておきます。
私は開発環境（ProxmoxのVMです）でAIとやりとりしながら実装し、実装が終わったらそれをGitHubにプッシュ、そして運用環境としては別のノードからGitHub経由でgit pullし、そこでAnsibleを動かします。

{% asset_img flow.png 1024 alt %}

Ansibleを動かす開発環境、これはansyというホスト名にしていますが、これはProxmox配下のUbuntu26.04で動作させています。ここにはAIのCLIをインストールします。クライアントはmacですが、そこでVSCodeを起動し、ansyにSSHしてAnsibleコードを編集します。

実行時は、quory、以前の記事でも書きましたが、Proxmoxクラスタに関連するqdeviceです。Qdeviceは非常にリソースが少なく、そのままだとリソースの無駄なので、Ansibleの実行環境にしています。クラスターを操作する内容が含まれるので、実行環境はVMにはしていません。なお、Ansibleを定期的に実行するには、CronやSystemd Timerが必要となりますが、さすがにCLIでは運用しづらいので別途のSemaphoreUIというものを導入しています（また別の記事で紹介します）。

## Ansibleでできる「こんなこと」

以下は私のAnsibleのPlaybook一覧です。端的に纏めすぎで中身がよくわからないと思いますが、雰囲気だけは伝わると思います。軽いものであればヘルスチェックですし、重いものはOSパッチ適用です。

| playbook名                          | 内容                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `ca_trust_deploy.yml`               | Home CA証明書を全ノードのシステム信頼ストアへ配布・登録    |
| `cert_renew.yml`                    | 管理UI（Semaphore / PVE / Grafana）のTLS証明書を更新       |
| `cert_renew_quory.yml`              | quoryのSemaphore用TLS証明書を更新しメール通知（timer実行） |
| `cloudkey_cert_deploy.yml`          | UniFiのWeb UI証明書をAPI経由でアップロード・切替           |
| `monitoring_healthcheck.yml`        | 監視サーバーのヘルスチェック（read-only）                  |
| `proxmox_backup_restore_verify.yml` | VMバックアップを一時VMへ復元し起動確認後に破棄・検証       |
| `proxmox_evacuate_node.yml`         | パッチ適用前に対象ノードのVM / CTを別ノードへ退避          |
| `proxmox_healthcheck.yml`           | Proxmoxクラスタのヘルスチェック（read-only）               |
| `proxmox_hw_check.yml`              | Proxmoxノードのハードウェア状態を確認（read-only）         |
| `proxmox_patch_apply_node.yml`      | 指定ノードにOSパッチを適用（要事前VM退避）                 |
| `proxmox_patch_dryrun.yml`          | パッチ適用のドライラン（apt update + シミュレーション）    |
| `proxmox_patch_weekly_full.yml`     | pve2 → pve1 の順で週次ローリングパッチ適用を自動実行       |
| `proxmox_restore_vm_placement.yml`  | パッチ適用後にVM / CTを元のノードへ復帰させる              |
| `proxmox_snapshot_check.yml`        | Proxmoxスナップショット状況を確認（read-only）             |
| `radius_healthcheck.yml`            | RADIUSサーバーのヘルスチェック（read-only）                |
| `recovery_exec_setup.yml`           | 自律復旧用Codex実行環境（recovery-exec）を配備             |
| `recovery_ha_failover.yml`          | 自律復旧ラダー第3段。VMをHA経由で別ノードへ強制退避        |
| `recovery_io_setup.yml`             | 自律復旧用Slack I/Oブリッジ（recovery-io）を配備           |
| `recovery_probe_notify.yml`         | 異常対応結果の通知キューをSlackへ送信                      |
| `recovery_probe_setup.yml`          | 障害検知デーモンとhomelab-mute CLIを配備                   |
| `recovery_push_setup.yml`           | サービス障害時にquoryのCodexへ通知する仕組みを配備         |
| `recovery_service_restart.yml`      | 自律復旧ラダー第1段。対象サービスをsystemctl restart       |
| `recovery_vm_reboot.yml`            | 自律復旧ラダー第2段。VMをリブートして回復を試みる          |
| `sophos_trim.yml`                   | SophosファイアウォールのSSDをfstrimする                    |
| `systemd_timers.yml`                | Ansible定期実行用のsystemdタイマーを構成する               |
| `test_ca_env.yml`                   | CA関連の環境変数をデバッグ表示するテスト用                 |
| `time_sync_check.yml`               | quory基準で主要ホストのNTP時刻同期を確認（read-only）      |
| `time_sync_ntp_reference.yml`       | 各ノードのNTP参照先にquoryを追加する準備作業               |
| `ubuntu_nightly.yml`                | 再起動要否確認とサービスチェックを行う                     |
| `unifi_backup_fetch.yml`            | UniFiのバックアップを取得しNFSへ保存・ローテーション       |

## AIに任せすぎないためのルール

ホームラボの構成はその運用者によって大きく違いがあり、他人のAnsible構成やAIに対する考え方がそのまま他の人に採用できるとは限らないのが難しいところです。

一般的には以下のルールになります。

- いきなり本番変更させない
- destructive（破壊的）な操作は明示承認
- check mode / diff / dry-run
- Gitで管理する
- シェルよりAnsible moduleを優先

ただし、シェルよりAnsible moduleを優先とはいっても、私の場合その実装方法はAIに任せていることもありますが、自分で管理しやすいということでどうしても最初から実装するという方向性になりがちです。加えて、私はホームユーザーとして一般的なルールよりはセキュリティ面や安全面にはこだわる方だと思うので、残念ながら私（およびAI）が作ったAnsibleコードを多くの人に使ってもらうという事は難しいと感じています。

AIといえば、その基本的な動作を伝えるのはコンテキストですが、私はAnsibleに関しては以下のようなコンテキストを定めています。

```text

1. このリポジトリは homelab-ansible の正本である。
2. Proxmox、RADIUS、監視基盤、証明書、バックアップ、復旧処理を管理する。
3. Git を正本とし、ansy で開発・レビュー・commit/push を行う。
4. quory は本番 Ansible 実行基盤であり、原則として直接編集しない。
5. quory では Git から pull した確定済みコードだけを実行する。
6. Ansible playbook の中で git pull しない。
7. Proxmox ノードは pve1 / pve2 とする。
8. qdevice / 本番実行基盤は quory とする。
9. 開発環境は ansy とする。
10. RADIUS サーバーは authy とする。
11. 監視基盤は monnie とする。
12. Sophos Firewall は sophos-fw とする。
13. UniFi CloudKey は cloudkey とする。
14. リポジトリ内に IP アドレスを直接書かない。
15. ホスト指定は DNS 名または /etc/hosts の名前解決を使う。
16. IP が必要な場合は getent 等で実行時に解決する。
17. 標準のAnsible接続ユーザーは ann とする。
18. ann は NOPASSWD sudo を許可する。
19. 秘密鍵、パスフレーズ、認証情報はリポジトリに保存しない。
20. 秘密情報は vault / secret / local を含むファイル名にし、Git管理しない。
21. playbook は playbooks/*.yml に置く。
22. role は roles/ 配下に置く。
23. check 系 シェル は roles/*/files/*.sh に置く。
24. check 系 シェル は情報収集と JSON 整形だけを行う。
25. check 系 シェル は正常 / 異常判定をしない。
26. warning / critical の分類は Ansible tasks 側で行う。
27. host_vars との期待値比較も Ansible tasks 側で行う。
28. read-only playbook に変更操作を混ぜない。
29. patch / reboot / restart / migrate は専用 playbook に分離する。
30. 危険操作は確認なしで実行しない。
31. AIは自動決定主体ではなく、設計・実装・レビュー支援として使う。
32. 要求仕様整理は ChatGPT / Claude と会話して行う。
33. 実装は Claude Code が担当する。
34. レビューは Codex が担当する。
35. テストは Codex tester ロールが担当する。
36. 運用判断、本番実行判断、commit 判断は人間が行う。
37. AIが自律的に patch / reboot / migration を本番実行しない。
38. 要求仕様には目的、対象、制約、確認項目、除外範囲を書く。
39. 要求仕様には awk / sed / grep などの細かい実装方法を書きすぎない。
40. 実装後は implement ファイルに変更内容と確認結果を残す。
41. レビュー後は review ファイルに指摘内容を残す。
42. 指摘には must-fix / suggestion / nit の重大度を付ける。
43. Claude Code は Codex の指摘を鵜呑みにせず、トリアージする。
44. 指摘を棄却する場合は理由を記録する。
45. テスト計画は Claude Code が起案し、人間が承認する。
46. tester は playbook 実行時に必ず tester_mode=true を付ける。
47. tester_mode=true では対象ホストの実変更やSlack通知を起こさない。
48. 変更系 playbook は tester_gate で安全側に止める。
49. read-only playbook は SAFE として自動実行対象にできる。
50. UN-SAFE な操作は人間の明示判断なしに実行しない。
```

実装はClaudeCode、レビューはCodex、テスターはCodexにするなど、こういったものは個人の使い方によるのであくまで参考程度に留めておいてください。もちろん、セキュリティや安全面ということに拘らなければ、コンテキストは随分と少なくて済みます。

## Ansibleコードの具体例

シンプルなProxmoxのハードウェアチェックだとこのような例になります（途中一部省略しています）。yaml形式で記述します。大きな流れとしては人間が理解できる範囲で機能毎にまとめ、シェルで情報を一括取得、シェルには判断させず、Ansible側で判定をします。これによって、何を実行しているかがAnsibleのコードでわかるようになります。このコードは全てAIが作成してくれています。

``` yaml
- name: Copy proxmox hw check script
  ansible.builtin.copy:
    src: proxmox-hw-check.sh
    dest: /usr/local/sbin/proxmox-hw-check.sh
    mode: "0750"
    owner: root
    group: root

- name: Run proxmox hw check
  ansible.builtin.command:
    cmd: /usr/local/sbin/proxmox-hw-check.sh
  register: hwcheck_raw
  changed_when: false

- name: Fail if hw check returned no output
  ansible.builtin.fail:
    msg: "proxmox-hw-check.sh on {{ inventory_hostname }} returned empty output (rc={{ hwcheck_raw.rc }}). Run the script manually on the host to diagnose."
  when: hwcheck_raw.stdout | length == 0

- name: Parse hw check JSON
  ansible.builtin.set_fact:
    proxmox_hw: "{{ hwcheck_raw.stdout | from_json }}"

- name: Find collection failures
  ansible.builtin.set_fact:
    _collection_failures: "{{ []
      + ([] if proxmox_hw.collection_status.nics else ['NIC collection failed: ip -s link show returned unavailable'])
      + ([] if proxmox_hw.collection_status.zfs_pools else ['ZFS pool collection failed: zpool list returned unavailable'])
      + ([] if proxmox_hw.collection_status.zfs_scrub else ['ZFS scrub collection failed: zpool status returned unavailable'])
      + ([] if proxmox_hw.collection_status.disk else ['Disk collection failed: df returned unavailable'])
      }}"

- name: Find NICs in DOWN state
  ansible.builtin.set_fact:
    _nics_down: "{{ proxmox_hw.nics | selectattr('state', 'equalto', 'DOWN') | map(attribute='name') | list }}"

- name: Initialize NIC rate check results
  ansible.builtin.set_fact:
    _nics_errors: []
    _nics_dropped: []

- name: Check NIC error rates
  ansible.builtin.set_fact:
    _nics_errors: >-
      {{ _nics_errors + ([item.name] if
         (item.total_packets | int > 0) and
         ((item.total_errors | float / (item.total_packets | int + 1) * 100)
         > (proxmox_hw_check_nic_errors_warning_pct | float))
         else []) }}
  loop: "{{ proxmox_hw.nics | default([]) }}"

- name: Check NIC drop rates
  ansible.builtin.set_fact:
    _nics_dropped: >-
      {{ _nics_dropped + ([item.name] if
         (item.total_packets | int > 0) and
         ((item.total_dropped | float / (item.total_packets | int + 1) * 100)
         > (proxmox_hw_check_nic_dropped_warning_pct | float))
         else []) }}
  loop: "{{ proxmox_hw.nics | default([]) }}"

- name: Classify warnings
  ansible.builtin.set_fact:
    proxmox_hw_warnings: "{{ []
      + _collection_failures
      + (_nics_down | map('regex_replace', '^(.*)$', 'NIC \\1 is DOWN') | list)
      + (_nics_errors | map('regex_replace', '^(.*)$', 'NIC \\1 error rate exceeds threshold') | list)
      + (_nics_dropped | map('regex_replace', '^(.*)$', 'NIC \\1 drop rate exceeds threshold') | list)
      }}"

- name: Build report
  ansible.builtin.set_fact:
    proxmox_hw_report:
      host: "{{ inventory_hostname }}"
      collected_at: "{{ proxmox_hw.collected_at }}"
      collection_status: "{{ proxmox_hw.collection_status }}"
      cpu: "{{ proxmox_hw.cpu }}"
      memory: "{{ proxmox_hw.memory }}"
      zfs:
        pools: "{{ proxmox_hw.zfs.pools }}"
        scrub: "{{ proxmox_hw.zfs.scrub }}"
      disk:
        filesystems: "{{ proxmox_hw.disk.filesystems }}"
      nics: "{{ proxmox_hw.nics }}"
      result:
        status: "{{ 'WARNING' if proxmox_hw_warnings | length > 0 else 'OK' }}"
        warnings: "{{ proxmox_hw_warnings }}"

- name: Ensure report directory exists
  ansible.builtin.file:
    path: "{{ proxmox_hw_check_report_dir }}"
    state: directory
    mode: "0755"
  delegate_to: localhost
  become: false

- name: Save report
  ansible.builtin.copy:
    content: "{{ proxmox_hw_report | to_nice_json }}"
    dest: "{{ proxmox_hw_check_report_dir }}/{{ inventory_hostname }}_{{ Ansible_facts['date_time']['iso8601_basic_short'] }}.json"
  delegate_to: localhost
  become: false

- name: Build Semaphore hw summary
  ansible.builtin.set_fact:
    semaphore_hw_summary_text: |-
      {% set summary = namespace(result='OK', parts=[], warnings=[]) -%}
      {% for host in Ansible_play_hosts -%}
      {% set report = hostvars[host].proxmox_hw_report -%}
      ...省略...
      {% set nic_state = 'OK[' ~ (nic_names | join(',')) ~ ']' if nics_down | length == 0 else 'NG[' ~ ((nics_down | map('regex_replace', '^(.*)$', '\\1=DOWN') | list) | join(',')) ~ ']' -%}
      {% set nic_error_state = ('OK' if nic_errors | length == 0 else 'WARNING') ~
          '[total=' ~ (nic_totals.errors | string) ~
          ',rate=' ~ ('%g' | format(error_rate | round(4))) ~ '%' ~
          ',threshold=' ~ ('%g' | format(error_threshold | round(4))) ~ '%' ~
          ('' if nic_errors | length == 0 else ',nics=' ~ (nic_errors | join(','))) ~ ']' -%}
      {% set nic_drop_state = ('OK' if nic_dropped | length == 0 else 'WARNING') ~
          '[total=' ~ (nic_totals.dropped | string) ~
          ',rate=' ~ ('%g' | format(drop_rate | round(4))) ~ '%' ~
          ',physical_total=' ~ (physical_nic_totals.dropped | string) ~
          ',physical_rate=' ~ ('%g' | format(physical_drop_rate | round(4))) ~ '%' ~
          ',vmbr_total=' ~ (vmbr_nic_totals.dropped | string) ~
          ',vmbr_rate=' ~ ('%g' | format(vmbr_drop_rate | round(4))) ~ '%' ~
          ',threshold=' ~ ('%g' | format(drop_threshold | round(4))) ~ '%' ~
          ('' if nic_dropped | length == 0 else ',nics=' ~ (nic_dropped | join(','))) ~ ']' -%}
      {% set collection_state = 'OK' if collection_failures.items | length == 0 else 'NG[' ~ (collection_failures.items | join(',')) ~ ']' -%}
      {% set _ = summary.parts.append(host ~ '=' ~ report.result.status ~
          '(cpu_total=' ~ (report.cpu.total_cpus | string) ~
          ',memory_total=' ~ (report.memory.total_mb | string) ~ 'MB' ~
          ',zfs=' ~ (zfs.items | join(',') if zfs.items | length > 0 else 'none') ~
          ',nic_state=' ~ nic_state ~
          ',nic_errors=' ~ nic_error_state ~
          ',nic_drops=' ~ nic_drop_state ~
          ',collection=' ~ collection_state ~ ')') -%}
      {% endfor -%}
      {% if summary.warnings | length == 0 -%}
      {% set _ = summary.parts.append('Warnings=none') -%}
      {% else -%}
      {% set _ = summary.parts.append('Warnings=' ~ (summary.warnings | join('; '))) -%}
      {% endif -%}
      {% set _ = summary.parts.append('Checked=cpu,memory,zfs-pools,zfs-scrub,disk-filesystems,nic-state,nic-error-rate,nic-drop-rate,collection-status') -%}
      {{ summary.parts | join(' | ') }}
  run_once: true

- name: Print Semaphore hw summary
  ansible.builtin.debug:
    msg: "{{ semaphore_hw_summary_text }}"
  run_once: true

```

シェルの細かな情報は抜きにして、大凡の処理概要、特に何を判定しているかがこれでわかります。Ansible側が概要設計、シェル側が詳細設計と考えても良さそうです。

そして、シェルは以下になります（長くて申し訳ないですが、省略せずに掲載しています）。こちらもAIが生成してくれています。なお、このシェルはAnsibleに依存しないのでシェル単体でProxmox上でも動作します。Ansibleの特徴ですが、AnsibleマシンからProxmoxにSSH、そして多くはsudoでの実行が必要なので権限の昇格（become）が必要となります（そしてProxmoxにこのコードを流し込んで実行します）。こういった仕組みなので公開鍵認証が基本で、no passwordでsudo相当のコマンドを実行します。

``` bash
#!/bin/bash
# proxmox-hw-check.sh
# Collects Proxmox hardware info and outputs JSON.
# Shell responsibility: collection and JSON formatting only. No judgments.

set -uo pipefail

# CPU
cpu_model=$(lscpu 2>/dev/null | awk -F':[[:space:]]+' '/^Model name:/{print $2; exit}')
cpu_model=${cpu_model:-unknown}
cpu_sockets=$(lscpu 2>/dev/null | awk '/^Socket\(s\):/{print $NF; exit}')
cpu_sockets=${cpu_sockets:-0}
cpu_cores_per_socket=$(lscpu 2>/dev/null | awk '/^Core\(s\) per socket:/{print $NF; exit}')
cpu_cores_per_socket=${cpu_cores_per_socket:-0}
cpu_threads_per_core=$(lscpu 2>/dev/null | awk '/^Thread\(s\) per core:/{print $NF; exit}')
cpu_threads_per_core=${cpu_threads_per_core:-0}
cpu_total=$(lscpu 2>/dev/null | awk '/^CPU\(s\):/{print $NF; exit}')
cpu_total=${cpu_total:-0}

# Memory
mem_total_kb=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')
mem_total_kb=${mem_total_kb:-0}

# ZFS pool summary
zpool_list_raw=$(zpool list -H -o name,size,alloc,free,cap,health 2>/dev/null || echo "unavailable")

# ZFS status (for scrub info)
zpool_status_raw=$(zpool status 2>/dev/null || echo "unavailable")

# Disk filesystems
df_raw=$(df -Ph 2>/dev/null || echo "unavailable")

# NIC stats (excluding loopback and transient virtual interfaces)
ip_link_raw=$(ip -s link show 2>/dev/null || echo "unavailable")

CPU_MODEL="$cpu_model" \
CPU_SOCKETS="$cpu_sockets" \
CPU_CORES_PER_SOCKET="$cpu_cores_per_socket" \
CPU_THREADS_PER_CORE="$cpu_threads_per_core" \
CPU_TOTAL="$cpu_total" \
MEM_TOTAL_KB="$mem_total_kb" \
ZPOOL_LIST_RAW="$zpool_list_raw" \
ZPOOL_STATUS_RAW="$zpool_status_raw" \
DF_RAW="$df_raw" \
IP_LINK_RAW="$ip_link_raw" \
python3 - << 'PYEOF'
import json, os, re
from datetime import datetime, timezone, timedelta
JST = timezone(timedelta(hours=9))


def safe_int(val, default=0):
    try:
        return int(str(val).strip())
    except (ValueError, AttributeError):
        return default


def parse_zpool_list(raw):
    if not raw or raw.strip() == 'unavailable':
        return []
    pools = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 6:
            continue
        name, size, alloc, free, cap, health = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        pools.append({
            "name": name,
            "size": size,
            "alloc": alloc,
            "free": free,
            "capacity_pct": safe_int(cap.rstrip('%'), -1),
            "health": health
        })
    return pools


def parse_zpool_scrub(raw):
    if not raw or raw.strip() == 'unavailable':
        return []
    scrubs = []
    current_pool = None
    for line in raw.splitlines():
        m = re.match(r'^\s+pool:\s+(\S+)', line)
        if m:
            current_pool = m.group(1)
            continue
        m = re.match(r'^\s+scan:\s+(.*)', line)
        if m and current_pool is not None:
            scrubs.append({
                "pool": current_pool,
                "scan": m.group(1).strip()
            })
    return scrubs


def parse_df(raw):
    if not raw or raw.strip() == 'unavailable':
        return []
    filesystems = []
    lines = raw.splitlines()
    i = 1  # skip header
    while i < len(lines):
        parts = lines[i].split()
        if len(parts) == 1:
            # Long filesystem name on its own line (POSIX -P wrapping)
            filesystem = parts[0]
            i += 1
            if i < len(lines):
                p2 = lines[i].split()
                if len(p2) >= 5:
                    filesystems.append({
                        "filesystem": filesystem,
                        "size": p2[0], "used": p2[1], "avail": p2[2],
                        "use_pct": safe_int(p2[3].rstrip('%'), -1),
                        "mount": p2[4]
                    })
        elif len(parts) >= 6:
            filesystems.append({
                "filesystem": parts[0],
                "size": parts[1], "used": parts[2], "avail": parts[3],
                "use_pct": safe_int(parts[4].rstrip('%'), -1),
                "mount": parts[5]
            })
        i += 1
    return filesystems


def parse_nics(raw):
    if not raw or raw.strip() == 'unavailable':
        return []

    excluded_prefixes = ('lo', 'veth', 'tap', 'fwbr', 'fwln', 'fwpr', 'dummy')
    nics = []
    current_nic = None
    rx_header_seen = False
    tx_header_seen = False

    for line in raw.splitlines():
        m = re.match(r'^\d+:\s+(\S+?)[@:]\s', line)
        if m:
            if current_nic:
                nics.append(current_nic)
            name = m.group(1)
            if any(name.startswith(p) for p in excluded_prefixes):
                current_nic = None
                rx_header_seen = tx_header_seen = False
                continue
            state_m = re.search(r'\bstate\s+(\S+)', line)
            current_nic = {
                "name": name,
                "state": state_m.group(1) if state_m else 'UNKNOWN',
                "rx_packets": 0, "rx_errors": 0, "rx_dropped": 0,
                "tx_packets": 0, "tx_errors": 0, "tx_dropped": 0
            }
            rx_header_seen = tx_header_seen = False
            continue

        if current_nic is None:
            continue

        stripped = line.strip()
        if re.match(r'^RX:', stripped):
            rx_header_seen = True
            tx_header_seen = False
            continue
        if re.match(r'^TX:', stripped):
            tx_header_seen = True
            rx_header_seen = False
            continue
        if rx_header_seen:
            vals = stripped.split()
            if len(vals) >= 4:
                current_nic['rx_packets'] = safe_int(vals[1])
                current_nic['rx_errors'] = safe_int(vals[2])
                current_nic['rx_dropped'] = safe_int(vals[3])
            rx_header_seen = False
            continue
        if tx_header_seen:
            vals = stripped.split()
            if len(vals) >= 4:
                current_nic['tx_packets'] = safe_int(vals[1])
                current_nic['tx_errors'] = safe_int(vals[2])
                current_nic['tx_dropped'] = safe_int(vals[3])
            tx_header_seen = False
            continue

    if current_nic:
        nics.append(current_nic)

    for nic in nics:
        nic['total_packets'] = nic['rx_packets'] + nic['tx_packets']
        nic['total_errors'] = nic['rx_errors'] + nic['tx_errors']
        nic['total_dropped'] = nic['rx_dropped'] + nic['tx_dropped']

    return nics


_zpool_list_raw = os.environ['ZPOOL_LIST_RAW']
_zpool_status_raw = os.environ['ZPOOL_STATUS_RAW']
_df_raw = os.environ['DF_RAW']
_ip_link_raw = os.environ['IP_LINK_RAW']

zpool_pools = parse_zpool_list(_zpool_list_raw)
zpool_scrubs = parse_zpool_scrub(_zpool_status_raw)
filesystems = parse_df(_df_raw)
nics = parse_nics(_ip_link_raw)

collection_status = {
    "nics": _ip_link_raw.strip() != 'unavailable',
    "zfs_pools": _zpool_list_raw.strip() != 'unavailable',
    "zfs_scrub": _zpool_status_raw.strip() != 'unavailable',
    "disk": _df_raw.strip() != 'unavailable',
}

print(json.dumps({
    "collected_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S%z"),
    "collection_status": collection_status,
    "cpu": {
        "model": os.environ['CPU_MODEL'].strip(),
        "sockets": safe_int(os.environ['CPU_SOCKETS']),
        "cores_per_socket": safe_int(os.environ['CPU_CORES_PER_SOCKET']),
        "threads_per_core": safe_int(os.environ['CPU_THREADS_PER_CORE']),
        "total_cpus": safe_int(os.environ['CPU_TOTAL'])
    },
    "memory": {
        "total_mb": safe_int(os.environ['MEM_TOTAL_KB']) // 1024
    },
    "zfs": {
        "pools": zpool_pools,
        "scrub": zpool_scrubs
    },
    "disk": {
        "filesystems": filesystems
    },
    "nics": nics
}))
PYEOF
```

少し長いですが、AIが生成した実例としてあえて掲載します。  
ここで見ていただきたいのは、細かな実装そのものではなく、shellは情報収集に徹し、Ansible側で判定・レポート化しているという役割分担です。

ちなみに、これをProxmox上で叩くと以下の結果になります（もちろん、対象のNICの名前が異なりますので環境に依存します）。実際の出力は1行のJSONになるため、人間がそのまま読むには向きません。  
その代わり、Ansible側で `from_json` して扱いやすい構造に変換できます。

``` text
{"collected_at": "2026-07-05T18:31:54+0900", "collection_status": {"nics": true, "zfs_pools": true, "zfs_scrub": true, "disk": true}, "cpu": {"model": "AMD Ryzen 5 5600G with Radeon Graphics", "sockets": 1, "cores_per_socket": 6, "threads_per_core": 2, "total_cpus": 12}, "memory": {"total_mb": 47537}, "zfs": {"pools": [{"name": "rpool", "size": "928G", "alloc": "99.7G", "free": "828G", "capacity_pct": 10, "health": "ONLINE"}], "scrub": [{"pool": "rpool", "scan": "scrub repaired 0B in 00:00:47 with 0 errors on Sun Jun 14 00:24:48 2026"}]}, "disk": {"filesystems": [{"filesystem": "udev", "size": "22G", "used": "0", "avail": "22G", "use_pct": 0, "mount": "/dev"}, {"filesystem": "tmpfs", "size": "4.7G", "used": "3.7M", "avail": "4.7G", "use_pct": 1, "mount": "/run"}, {"filesystem": "rpool/ROOT/pve-1", "size": "810G", "used": "9.8G", "avail": "800G", "use_pct": 2, "mount": "/"}, {"filesystem": "tmpfs", "size": "24G", "used": "72M", "avail": "24G", "use_pct": 1, "mount": "/dev/shm"}, {"filesystem": "efivarfs", "size": "128K", "used": "33K", "avail": "91K", "use_pct": 27, "mount": "/sys/firmware/efi/efivars"}, {"filesystem": "tmpfs", "size": "5.0M", "used": "0", "avail": "5.0M", "use_pct": 0, "mount": "/run/lock"}, {"filesystem": "tmpfs", "size": "24G", "used": "0", "avail": "24G", "use_pct": 0, "mount": "/tmp"}, {"filesystem": "tmpfs", "size": "1.0M", "used": "0", "avail": "1.0M", "use_pct": 0, "mount": "/run/credentials/systemd-journald.service"}, {"filesystem": "rpool", "size": "800G", "used": "128K", "avail": "800G", "use_pct": 1, "mount": "/rpool"}, {"filesystem": "rpool/var-lib-vz", "size": "846G", "used": "46G", "avail": "800G", "use_pct": 6, "mount": "/var/lib/vz"}, {"filesystem": "rpool/ROOT", "size": "800G", "used": "128K", "avail": "800G", "use_pct": 1, "mount": "/rpool/ROOT"}, {"filesystem": "rpool/data", "size": "800G", "used": "128K", "avail": "800G", "use_pct": 1, "mount": "/rpool/data"}, {"filesystem": "/dev/fuse", "size": "128M", "used": "36K", "avail": "128M", "use_pct": 1, "mount": "/etc/pve"}, {"filesystem": "tmpfs", "size": "1.0M", "used": "0", "avail": "1.0M", "use_pct": 0, "mount": "/run/credentials/getty@tty1.service"}, {"filesystem": "192.168.xxx.20:/volume1/Proxmox-backup", "size": "1.0T", "used": "131G", "avail": "894G", "use_pct": 13, "mount": "/mnt/pve/Synology-nfs"}, {"filesystem": "tmpfs", "size": "4.7G", "used": "4.0K", "avail": "4.7G", "use_pct": 1, "mount": "/run/user/1000"}]}, "nics": [{"name": "nic0", "state": "UP", "rx_packets": 12931676, "rx_errors": 0, "rx_dropped": 0, "tx_packets": 12365019, "tx_errors": 0, "tx_dropped": 0, "total_packets": 25296695, "total_errors": 0, "total_dropped": 0}, {"name": "nic1", "state": "UP", "rx_packets": 293521, "rx_errors": 0, "rx_dropped": 0, "tx_packets": 106899, "tx_errors": 0, "tx_dropped": 0, "total_packets": 400420, "total_errors": 0, "total_dropped": 0}, {"name": "nic2", "state": "UP", "rx_packets": 28088174, "rx_errors": 0, "rx_dropped": 0, "tx_packets": 11623620, "tx_errors": 0, "tx_dropped": 0, "total_packets": 39711794, "total_errors": 0, "total_dropped": 0}, {"name": "nic3", "state": "UP", "rx_packets": 364785, "rx_errors": 0, "rx_dropped": 0, "tx_packets": 68545, "tx_errors": 0, "tx_dropped": 0, "total_packets": 433330, "total_errors": 0, "total_dropped": 0}, {"name": "vmbr0", "state": "UP", "rx_packets": 10007433, "rx_errors": 0, "rx_dropped": 312, "tx_packets": 9512530, "tx_errors": 0, "tx_dropped": 2, "total_packets": 19519963, "total_errors": 0, "total_dropped": 314}, {"name": "vmbr1", "state": "UP", "rx_packets": 156880, "rx_errors": 0, "rx_dropped": 10, "tx_packets": 5, "tx_errors": 0, "tx_dropped": 0, "total_packets": 156885, "total_errors": 0, "total_dropped": 10}, {"name": "vmbr2", "state": "UP", "rx_packets": 2069456, "rx_errors": 0, "rx_dropped": 5, "tx_packets": 1259524, "tx_errors": 0, "tx_dropped": 0, "total_packets": 3328980, "total_errors": 0, "total_dropped": 5}, {"name": "vmbr3", "state": "UP", "rx_packets": 67897, "rx_errors": 0, "rx_dropped": 5, "tx_packets": 5, "tx_errors": 0, "tx_dropped": 0, "total_packets": 67902, "total_errors": 0, "total_dropped": 5}]}
```

Ansibleなしで直接実行してJSONが正しく出力されています（CPU/メモリ/ZFS/ディスク/NIC情報）。これはAnsibleに依存せず単体で動作します。そして、このJSONでは人間が目で見てわからないのでこれをAnsibleで整形した上でReportを作成します。
nic0-3までの物理NICはdroppedが0、仮想NICについては若干のdropがあります。私は閾値で0.5％以上のdropがあったら警告を出すようにしています。そういった判定も全てAnsible側でシェルでは判断を加えません。こういったルールによってコードの再利用がしやすくなります。

### VSCode

VS Codeはこんな画面です。最初、気軽にやるのであればVSCodeからスタートするのも良いと思います。

{% asset_img vscode.png 1024 alt %}

例えば、Microsoftから提供されている無償のVSCodeを使い、Microsoft提供の”Remote - SSH”、"Codex – OpenAI’s coding agent"、”Claude Code for VS Code”をインストールします。

GitHub以前にgitコマンドはよくわからないという方もいらっしゃると思います。ここで使うのはあくまでローカルリポジトリになると思いますので、他人と共有する必要がなければgit initから始まり、Playbook作成の区切りがついたところで、git pushしておけば良い程度で、使うコマンドも限定的です。しかもVS Codeがあればgit（リポジトリ）の初期化からGUIでできますし、コミットもGitHubとの同期（プッシュ）もGUIでできます。

## まとめ

今回はAnsibleの紹介をしました。非常に長くなってしまいましたが、Ansibleとは何かという雰囲気は伝わったのではないでしょうか？

今回紹介したハードウェアチェックのスクリプトはこれでもコンパクトなほうです。これを流石に手作業で作ろうとは思いませんが、大部分をAIが実装してくれるのであればチャレンジしてみようかなとお考えの方もいらっしゃると思います。

AIを運用に使ううえで重要なのは、便利な作業を任せることだけではなく、任せてはいけない範囲を明確にすることです。

これだけだとどのようにAIを使いながら構築していくのかがまだ伝わらないと思いますので、次回は少しAIとの仕様の詰め方などについてもまとめられたらと考えています。
