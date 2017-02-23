# Relief_Valve

[![Build status](https://ci.appveyor.com/api/projects/status/u86r2vecm8s0djaw?svg=true)](https://ci.appveyor.com/project/l3laze/relief-valve)  [![Build Status](https://travis-ci.org/l3laze/Relief_Valve.svg?branch=master)](https://travis-ci.org/l3laze/Relief_Valve)


#What is it?


  A tool to help manage the Steam client.


#What does it do?


  Currently it supports managing auto-update behavior for apps installed via
    Steam and can apply an "offline fix" to make apps which have an update
    available able to be used in offline mode.


  *Note* - It's also possible to use the Steam client's Developer Console to [skip updates] (https://www.reddit.com/r/Steam/comments/5j2eh0/psa_delayskip_updates_for_appsgames_installed_via/?st=izhl9m7o&sh=ff361709).
      Just found this out a few months ago, but I already had all this code working
      by then so I decided to leave it in as a feature.


#Offline Fix Usage


  1) Start Steam in offline mode, and then close it.
  2) Use ReliefValve to apply the "offline fix" to the app(s) you want to use.
  3) Start Steam again (make sure it's in offline mode).


  *Note* - If you still have internet access you may need to turn it off
    completely on your PC or block Steam from accessing it by using a firewall
    so that it doesn't ruin the offline fix for you.


#Offline Fix Explanation


  Each time Steam starts up it loads all of the appmanifest files it can find
    both in it's default installation directory (Steam/steamapps) and your
    custom Steam Library Folders listed in the file
    Steam/steamapps/libraryfolders.vdf, and checks the server(s) for an update
    to each of them, modifying the appmanifest accordingly.


  Each appmanifest file contains an entry "StateFlags" which tells Steam about
    the state of the installed app that it is tied to
    ([list of possible states](https://github.com/lutris/lutris/blob/master/docs/steam.rst)).
    A "StateFlags" value of "6" tells Steam that the app is fully installed but
    also has an update available. When you try to launch the app it will start
    the update, or try to and fail if you're offline, and of course you can't
    use the app until it's finished updating.


  If you start Steam in offline mode though (or with your internet off if you
    do still have internet access) it will not be able to check for updates
    and cannot update the appmanifest files. So, by changing the StateFlags
    value to "4" and then running Steam offline you can use the apps without
    updating them.


#Note


  This is an unsigned application and it will not run on Windows or Mac
    without first warning the user and asking for consent (on Windows). On Mac
    it can be run by right clicking & pressing "Open" and then "Open" again in
    the dialog that pops up; you may need to enter the admin password to do this.
