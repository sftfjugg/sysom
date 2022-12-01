STATUS_HWERROR=5
STATUS_SYSRQ=6
# panic type
PANIC_UAF=1
PANIC_DOUBLEFREE=2
PANIC_OOBREAD=3
PANIC_OOBWRITE=4
PANIC_NULLPOINTER=5
PANIC_UNINITVAR=6
PANIC_STACKCORRUPTION=7
PANIC_INVALIDIPPTR=8
PANIC_INVALIDDATAPTR=9
PANIC_BUGON=10
PANIC_DIVIDEERROR=11
PANIC_HARDLOCKUP=12
PANIC_SOFTLOCKUP=13
PANIC_HUNGTASK=14
PANIC_RCUSTALL=15

BASEMODS = ['ext4','jbd2','overlay','libata','libiscsi','bridge','nf_conntrack','nf_conntrack_ipv4',
            'nf_nat','nf_nat_ipv4','iptable_nat','tun','binfmt_misc','xt_CHECKSUM','iptable_mangle',
            'nf_defrag_ipv4','xt_conntrack','ipt_REJECT','nf_reject_ipv4','stp','llc','ebtable_filter',
            'ebtables','ip6_tables','iptable_filter','iscsi_tcp','libiscsi_tcp','scsi_transport_iscsi',
            'bonding','dm_mod','sg','ip_tables','mbcache','sd_mod','mpt3sas','raid_class','scsi_transport_sas',
            'ahci','libahci','btrfs','zram','numa_balancer']
