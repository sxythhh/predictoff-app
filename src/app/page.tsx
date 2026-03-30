"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useLive, useBaseBetslip, useSportsNavigation } from "@azuro-org/sdk";
import HeaderClient from "./HeaderClient";
import { LiveTopEvents } from "@/components/waliet/LiveTopEvents";
import { LiveGameSections } from "@/components/waliet/LiveGameSections";
// SearchGames removed — use header search modal instead
import { PlayBetslip } from "@/components/waliet/PlayBetslip";
import { useGameModal, GameModal, GameModalProvider } from "@/components/waliet/GameModal";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SocialFeed } from "@/components/social/SocialFeed";
import { WaveLeaderboard } from "@/components/waliet/WaveLeaderboard";
import { sportIcons } from "@/components/waliet/sport-icons";

// ─── SVG Icons ──────────────────────────────────────────────────

function LogoText() {
  return (
    <svg width="128" height="13" viewBox="0 0 127 13" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.21435 3.25542C3.8139 3.25542 2.91308 3.77053 2.43071 4.9061V0H0V11.9886H1.89343L2.37701 10.3794C2.84453 11.6088 3.75984 12.165 5.21432 12.165C7.47126 12.165 8.43173 10.8285 8.43173 7.71023C8.43173 4.5919 7.47129 3.25542 5.21435 3.25542ZM4.20894 10.2669C2.95559 10.2669 2.41824 9.51006 2.41824 7.71038C2.41824 5.91071 2.95548 5.15375 4.20894 5.15375C5.4624 5.15375 5.99953 5.91068 5.99953 7.71038C5.99953 9.49309 5.46229 10.2669 4.20894 10.2669ZM102.532 0H105.498L102.516 6.01806L105.498 11.9886H102.532L100.004 6.41852L97.4754 11.9886H94.5102L97.492 6.01806L94.5102 0H97.4754L100.004 5.58459L102.532 0ZM111.731 5.59226L109.199 0H106.234L109.417 6.42622H110.45V11.9886H113.011V6.42622H114.044L117.227 0H114.262L111.731 5.59226ZM127 10.0061V11.9936H117.965V8.03574L125.499 1.98753H118.128V0H127V3.95792L119.449 10.0061H127ZM91.4585 9.40573H88.8761V11.988H91.4585V9.40573ZM80.8719 7.71069C80.8719 8.00001 80.8609 8.27488 80.838 8.53365H74.5871C74.7432 9.90134 75.3423 10.491 76.5012 10.491C77.3471 10.491 77.8953 10.1703 78.1895 9.46778H80.6898C80.2349 11.3385 78.913 12.1657 76.501 12.1657C73.4347 12.1657 72.1307 10.8294 72.1307 7.71069C72.1307 4.59278 73.4349 3.25652 76.501 3.25652C79.3567 3.25652 80.6844 4.41545 80.8532 7.09389C80.8657 7.29131 80.8719 7.49691 80.8719 7.71069ZM76.5009 4.93129C75.2851 4.93129 74.6861 5.57947 74.5674 7.09389H78.4352C78.3166 5.57947 77.7175 4.93129 76.5009 4.93129ZM61.5774 6.44317C61.5774 4.21619 60.113 3.25652 57.5194 3.25652C54.9479 3.25652 53.8348 4.05576 53.8025 5.91629H56.1043C56.1382 5.18923 56.6506 4.93129 57.5779 4.93129C58.5401 4.93129 59.1637 5.19515 59.1637 6.16914V6.63575H57.6018C55.6283 6.63575 53.475 6.80286 53.475 9.45851C53.475 11.4005 54.5839 12.1658 56.2799 12.1658C57.2394 12.1658 58.1662 11.9678 58.7386 11.1952C58.9599 10.8965 59.1083 10.636 59.1984 10.374L59.684 11.9894H61.5774V6.44317ZM57.1325 10.4527C56.4844 10.4425 55.9245 10.0591 55.9219 9.31668C55.9167 8.18489 56.7957 8.06442 57.6849 8.06442H59.139C59.2384 9.377 58.5816 10.4748 57.1325 10.4527ZM42.4493 5.91088C42.3136 6.24841 42.2627 6.59522 42.2627 7.28183V11.9878H39.832V3.42626H41.724L42.2112 5.04073C42.6015 3.81175 43.5544 3.24926 44.6562 3.26093C45.2432 3.26685 45.6887 3.39665 46.1104 3.73266C46.4488 4.00073 46.6983 4.38339 46.8927 4.85341C46.9184 4.91598 46.9412 4.98016 46.9625 5.0453C47.3491 3.80241 48.3065 3.23437 49.4137 3.24589C50.0008 3.2518 50.4462 3.38162 50.8679 3.71762C51.2065 3.98569 51.4558 4.36835 51.6502 4.83837C51.9668 5.60794 51.9534 6.59428 51.9394 7.62713C51.9365 7.84225 51.9335 8.05938 51.9335 8.277V11.9878H49.5143V7.28187C49.5143 6.59543 49.4636 6.24841 49.3278 5.91088C49.1337 5.4236 48.7488 5.20729 48.3099 5.20708C47.8708 5.20686 47.4848 5.42301 47.2904 5.91088C47.1547 6.24841 47.1039 6.59543 47.1039 7.28187V11.9878H44.6732V7.28183C44.6732 6.59539 44.6224 6.24841 44.4867 5.91088C44.2925 5.42356 43.9077 5.20718 43.4687 5.20701C43.0296 5.20683 42.6436 5.42298 42.4493 5.91088ZM14.1422 3.25472C11.076 3.25472 9.77131 4.59116 9.77131 7.70954C9.77131 10.8279 11.076 12.1643 14.1422 12.1643C17.2083 12.1643 18.513 10.8278 18.513 7.70954C18.513 4.59123 17.2082 3.25472 14.1422 3.25472ZM14.1422 10.2662C12.7722 10.2662 12.185 9.50935 12.185 7.70969C12.185 5.91002 12.7722 5.15306 14.1422 5.15306C15.5122 5.15306 16.0993 5.90994 16.0993 7.70969C16.0992 9.49239 15.5121 10.2662 14.1422 10.2662ZM19.8237 7.70954C19.8237 4.59116 21.1283 3.25472 24.1946 3.25472C27.2606 3.25472 28.5654 4.59123 28.5654 7.70954C28.5654 10.8278 27.2607 12.1643 24.1946 12.1643C21.1283 12.1643 19.8237 10.8279 19.8237 7.70954ZM22.2374 7.70969C22.2374 9.50935 22.8245 10.2662 24.1946 10.2662C25.5644 10.2662 26.1515 9.49239 26.1515 7.70969C26.1515 5.90994 25.5645 5.15306 24.1946 5.15306C22.8245 5.15306 22.2374 5.91002 22.2374 7.70969ZM32.712 7.47862L35.8302 3.42763H38.679L35.1029 7.70854L38.679 11.9891H35.8302L32.712 7.92568V11.9891H30.2813V3.42763H32.712V7.47862ZM69.0843 3.42763L65.9662 7.47862V3.42763H63.5355V11.9891H65.9662V7.92568L69.0843 11.9891H71.9332L68.357 7.70854L71.9332 3.42763H69.0843ZM86.7076 5.39643C85.3539 5.39643 84.9624 5.91045 84.9624 7.70951V11.9879H82.5324V3.42616H84.4243L84.9097 5.03485C85.234 3.81833 85.9355 3.25472 86.9685 3.25472H87.9666V5.39643H86.7076Z" fill="#FAFAFC"/>
    </svg>
  );
}


function XIcon() {
  return (
    <svg width="18" height="15" viewBox="0 0 18 15" fill="none">
      <path d="M13.782 0H16.466L10.603 6.354L17.5 15H12.1L7.87 9.756L3.03 15H0.347L6.617 8.204L0 0H5.537L9.36 4.793L13.782 0ZM12.841 13.477H14.327L4.73 1.443H3.134L12.841 13.477Z" fill="white"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="15" viewBox="0 0 18 15" fill="none">
      <path d="M17.8345 1.36494L15.1348 14.0946C14.9303 14.9928 14.4001 15.2164 13.6463 14.7935L9.5321 11.7628L7.54913 13.6716C7.32937 13.8914 7.14538 14.0741 6.72247 14.0741L7.01761 9.88585L14.6403 2.99911C14.9725 2.70396 14.5675 2.53914 14.1254 2.83556L4.70244 8.76915L0.645774 7.49913C-0.235831 7.22315 -0.252441 6.61752 0.829762 6.19333L16.6961 0.0795855C17.4308 -0.195118 18.0735 0.24313 17.8333 1.36622L17.8345 1.36494Z" fill="white"/>
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
      <path d="M11.5094 9.80837C11.3425 9.8075 11.1795 9.75754 11.0408 9.66471C10.9021 9.57188 10.7937 9.44029 10.7292 9.28632C10.6648 9.13235 10.647 8.96281 10.6782 8.79883C10.7094 8.63484 10.7881 8.48365 10.9046 8.36409C11.5422 7.7234 11.9002 6.85627 11.9002 5.95237C11.9002 5.04846 11.5422 4.18134 10.9046 3.54064C10.7477 3.38006 10.6608 3.16391 10.6627 2.93942C10.6647 2.71493 10.7554 2.50035 10.9151 2.34255C11.0748 2.18475 11.2905 2.09656 11.515 2.09726C11.7395 2.09795 11.9546 2.18747 12.1133 2.34625C13.0654 3.3049 13.5998 4.60121 13.5998 5.95237C13.5998 7.30352 13.0654 8.59984 12.1133 9.55848C12.0341 9.63797 11.94 9.70099 11.8364 9.74388C11.7327 9.78677 11.6216 9.80869 11.5094 9.80837ZM6.08931 9.56358C6.16876 9.48507 6.23194 9.39166 6.27525 9.28871C6.31856 9.18575 6.34115 9.07527 6.34172 8.96358C6.34229 8.85188 6.32083 8.74117 6.27856 8.63778C6.2363 8.53439 6.17407 8.44035 6.09543 8.36103C5.45813 7.72038 5.10037 6.85347 5.10037 5.94982C5.10037 5.04616 5.45813 4.17926 6.09543 3.5386C6.17392 3.45924 6.23601 3.36519 6.27816 3.26184C6.3203 3.15848 6.34168 3.04783 6.34106 2.93621C6.34045 2.82459 6.31785 2.71419 6.27457 2.6113C6.23129 2.50841 6.16816 2.41506 6.0888 2.33656C6.00944 2.25807 5.91539 2.19598 5.81203 2.15384C5.70867 2.11169 5.59803 2.09031 5.48641 2.09093C5.37479 2.09154 5.26438 2.11414 5.1615 2.15742C5.05861 2.20071 4.96525 2.26383 4.88676 2.34319C3.93429 3.30188 3.39972 4.59842 3.39972 5.94982C3.39972 7.30122 3.93429 8.59775 4.88676 9.55644C4.96521 9.63595 5.05856 9.69922 5.16148 9.74262C5.2644 9.78602 5.37486 9.8087 5.48656 9.80936C5.59825 9.81002 5.70898 9.78866 5.8124 9.74648C5.91583 9.70431 6.00993 9.64216 6.08931 9.56358ZM14.8172 11.6198C16.2222 10.0655 17 8.04499 17 5.94982C17 3.85465 16.2222 1.83409 14.8172 0.27979C14.666 0.112612 14.4546 0.0123525 14.2294 0.00106689C14.0043 -0.0102187 13.7839 0.0683941 13.6167 0.219611C13.4495 0.370828 13.3493 0.582263 13.338 0.807402C13.3267 1.03254 13.4053 1.25294 13.5565 1.42012C14.6787 2.66196 15.2999 4.2761 15.2999 5.94982C15.2999 7.62354 14.6787 9.23768 13.5565 10.4795C13.4053 10.6467 13.3267 10.8671 13.338 11.0922C13.3493 11.3174 13.4495 11.5288 13.6167 11.68C13.7839 11.8312 14.0043 11.9099 14.2294 11.8986C14.4546 11.8873 14.666 11.787 14.8172 11.6198ZM3.38332 11.68C3.46621 11.6052 3.53354 11.5149 3.58148 11.414C3.62942 11.3132 3.65702 11.2039 3.6627 11.0925C3.66838 10.981 3.65204 10.8694 3.6146 10.7643C3.57717 10.6591 3.51937 10.5623 3.44452 10.4795C2.32239 9.23768 1.70115 7.62354 1.70115 5.94982C1.70115 4.2761 2.32239 2.66196 3.44452 1.42012C3.58846 1.25172 3.66102 1.03381 3.64678 0.812737C3.63254 0.591664 3.53262 0.384867 3.36827 0.236325C3.20391 0.087784 2.9881 0.00921726 2.76671 0.0173342C2.54533 0.0254511 2.33585 0.119611 2.18281 0.27979C0.777862 1.83409 0 3.85465 0 5.94982C0 8.04499 0.777862 10.0655 2.18281 11.6198C2.25767 11.7027 2.3481 11.7699 2.44896 11.8178C2.54981 11.8656 2.65911 11.8931 2.7706 11.8987C2.88209 11.9043 2.99359 11.8879 3.09872 11.8503C3.20385 11.8128 3.30056 11.7549 3.38332 11.68ZM8.50053 4.67485C8.16238 4.67485 7.83809 4.80918 7.59899 5.04828C7.35989 5.28738 7.22556 5.61168 7.22556 5.94982C7.22556 6.28796 7.35989 6.61225 7.59899 6.85135C7.83809 7.09046 8.16238 7.22478 8.50053 7.22478C8.83867 7.22478 9.16296 7.09046 9.40206 6.85135C9.64116 6.61225 9.77549 6.28796 9.77549 5.94982C9.77549 5.61168 9.64116 5.28738 9.40206 5.04828C9.16296 4.80918 8.83867 4.67485 8.50053 4.67485Z" fill="#FE7C8C"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path d="M0 8.5C0 6.24566 0.895533 4.08365 2.48959 2.48959C4.08365 0.895533 6.24566 0 8.5 0C10.7543 0 12.9163 0.895533 14.5104 2.48959C16.1045 4.08365 17 6.24566 17 8.5C17 10.7543 16.1045 12.9163 14.5104 14.5104C12.9163 16.1045 10.7543 17 8.5 17C6.24566 17 4.08365 16.1045 2.48959 14.5104C0.895533 12.9163 0 10.7543 0 8.5ZM5.41777 2.00077C4.46376 2.45445 3.62096 3.112 2.94885 3.927L3.79492 6.67838L5.11046 7.11646L7.84615 5.03723V3.61969L5.41777 2.00077ZM1.35477 9.32908C1.48554 10.4602 1.87785 11.5129 2.47023 12.4218H4.96008L5.79046 11.5914L4.71423 8.36138L3.37515 7.91546L1.35477 9.32908ZM7.04323 15.5432C8.00433 15.7411 8.99567 15.7411 9.95677 15.5432L10.9898 13.2208L10.1908 12.4231H6.80915L6.01146 13.2208L7.04323 15.5445V15.5432ZM14.5285 12.4231C15.1038 11.5417 15.4909 10.5269 15.6322 9.435L13.6131 7.92069L12.2858 8.36269L11.2095 11.5927L12.0399 12.4231H14.5285ZM14.0342 3.90608C13.3649 3.10015 12.5282 2.44955 11.5822 1.99946L9.15385 3.61969V5.03723L11.8895 7.11646L13.2025 6.67969L14.0342 3.90608Z" fill="white"/>
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none" style={{ transform: "rotate(90deg)" }}>
      <path d="M9.4353 6.88192C8.47857 4.29509 5.07109 4.15391 5.89478 0.396044C5.95572 0.116743 5.66829 -0.0985725 5.43774 0.0466641C3.22364 1.40356 1.63417 4.12345 2.96872 7.68631C3.07841 7.9778 2.74934 8.25101 2.51168 8.06108C1.40869 7.19169 1.29291 5.94347 1.39041 5.04869C1.42697 4.71963 1.01158 4.56119 0.834856 4.83338C0.420475 5.49354 0 6.55794 0 8.16265C0.0368363 9.31514 0.46976 10.4197 1.22584 11.2903C1.98192 12.1609 3.01496 12.7443 4.15092 12.9423C5.63173 13.1393 7.23542 12.8539 8.38716 11.757C9.65468 10.5332 10.1178 8.58109 9.4353 6.88192Z" fill="#8A8A98"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
      <path d="M1.26133 0.261326L4.73395 3.73395L1.26133 0.261326Z" fill="#54545C"/>
      <path d="M0.261326 1.52312C0.178475 1.44027 0.112755 1.34191 0.0679164 1.23366C0.023078 1.12541 0 1.00939 0 0.892224C0 0.775055 0.023078 0.659034 0.0679164 0.550785C0.112755 0.442535 0.178475 0.344177 0.261326 0.261326C0.344177 0.178475 0.442535 0.112755 0.550785 0.0679164C0.659034 0.023078 0.775055 0 0.892224 0C1.00939 0 1.12541 0.023078 1.23366 0.0679164C1.34191 0.112755 1.44027 0.178475 1.52312 0.261326L5.63066 4.36887C5.97967 4.71788 5.97967 5.28166 5.63066 5.63066L1.52312 9.73821C1.17411 10.0872 0.610333 10.0872 0.261326 9.73821C-0.0876817 9.38921 -0.0876817 8.82543 0.261326 8.47642L3.73395 5L0.261326 1.52312Z" fill="#54545C"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M8.46836 0.261326L4.99574 3.73395L1.52312 0.261326C1.44027 0.178475 1.34191 0.112755 1.23366 0.0679164C1.12541 0.023078 1.00939 0 0.892223 0C0.775055 0 0.659033 0.023078 0.550784 0.0679164C0.442534 0.112755 0.344177 0.178475 0.261326 0.261326C0.178475 0.344177 0.112755 0.442535 0.0679164 0.550785C0.023078 0.659034 0 0.775055 0 0.892224C0 1.00939 0.023078 1.12541 0.0679164 1.23366C0.112755 1.34191 0.178475 1.44027 0.261326 1.52312L4.36887 5.63066C4.71788 5.97967 5.28166 5.97967 5.63066 5.63066L9.73821 1.52312C10.0872 1.17411 10.0872 0.610333 9.73821 0.261326C9.56828 0.0958578 9.34047 0.00326502 9.10328 0.00326502C8.8661 0.00326502 8.63829 0.0958578 8.46836 0.261326Z" fill="#54545C"/>
    </svg>
  );
}


// ─── Data ────────────────────────────────────────────────────────






// ─── Components ──────────────────────────────────────────────────


// SidebarLeft replaced by AppSidebar component

function EventFilter() {
  const { isLive, changeLive } = useLive();
  const [showFavourites, setShowFavourites] = useState(false);
  const [, startTransition] = useTransition();

  const switchMode = useCallback((live: boolean) => {
    startTransition(() => {
      changeLive(live);
      setShowFavourites(false);
    });
  }, [changeLive]);

  return (
    <div className="flex items-center gap-1.5 px-2 pt-3 pb-1">
      <button
        type="button"
        onClick={() => switchMode(false)}
        className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
          !isLive && !showFavourites
            ? "bg-accent text-btn-primary-text"
            : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M12.5001 0.833252H7.5001V2.49992H12.5001V0.833252ZM17.5501 4.11659C17.4346 3.99968 17.2971 3.90686 17.1454 3.84351C16.9938 3.78016 16.8311 3.74753 16.6668 3.74753C16.5024 3.74753 16.3397 3.78016 16.1881 3.84351C16.0365 3.90686 15.8989 3.99968 15.7834 4.11659L14.8168 5.08325C13.4679 3.94995 11.7618 3.33008 10.0001 3.33325C8.16677 3.33325 6.49177 3.99159 5.18344 5.08325L4.21677 4.11659C4.10128 3.99968 3.96373 3.90686 3.8121 3.84351C3.66047 3.78016 3.49777 3.74753 3.33344 3.74753C3.1691 3.74753 3.00641 3.78016 2.85477 3.84351C2.70314 3.90686 2.56559 3.99968 2.4501 4.11659C1.96677 4.60825 1.95844 5.39992 2.4501 5.88325L3.56677 6.99992C2.8687 8.15669 2.49987 9.48217 2.5001 10.8333C2.5001 12.8224 3.29028 14.73 4.6968 16.1366C6.10333 17.5431 8.01098 18.3333 10.0001 18.3333C11.9892 18.3333 13.8969 17.5431 15.3034 16.1366C16.7099 14.73 17.5001 12.8224 17.5001 10.8333C17.5001 9.43325 17.1084 8.12492 16.4334 6.99992L17.5501 5.88325C18.0418 5.39159 18.0418 4.59992 17.5501 4.11659ZM13.0918 8.92492L11.6084 10.4083C11.6418 10.5416 11.6668 10.6833 11.6668 10.8333C11.6668 11.7499 10.9168 12.4999 10.0001 12.4999C9.08344 12.4999 8.33344 11.7499 8.33344 10.8333C8.33344 9.91658 9.08344 9.16658 10.0001 9.16658C10.1501 9.16658 10.2918 9.19158 10.4251 9.22492L11.9084 7.74159C11.9856 7.66443 12.0772 7.60323 12.178 7.56148C12.2788 7.51973 12.3868 7.49823 12.4959 7.49823C12.605 7.49823 12.7131 7.51973 12.8139 7.56148C12.9147 7.60323 13.0063 7.66443 13.0834 7.74159C13.1606 7.81874 13.2218 7.91033 13.2635 8.01113C13.3053 8.11194 13.3268 8.21998 13.3268 8.32908C13.3268 8.43819 13.3053 8.54623 13.2635 8.64704C13.2218 8.74784 13.1606 8.83943 13.0834 8.91658L13.0918 8.92492Z" fill="currentColor"/>
        </svg>
        Starting Soon
      </button>
      <button
        type="button"
        onClick={() => switchMode(true)}
        className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
          isLive && !showFavourites
            ? "bg-status-live text-white"
            : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 19 19" fill="none">
          <path d="M9.16667 0C4.1 0 0 4.1 0 9.16667C0 14.2333 4.1 18.3333 9.16667 18.3333C14.2333 18.3333 18.3333 14.2333 18.3333 9.16667C18.3333 4.1 14.2333 0 9.16667 0ZM12.675 9.90833L7.04167 12.725C6.49167 13 5.83333 12.6 5.83333 11.9833V6.35C5.83333 5.73333 6.48333 5.325 7.04167 5.60833L12.675 8.425C12.8137 8.49411 12.9303 8.60052 13.0119 8.73227C13.0934 8.86402 13.1366 9.01589 13.1366 9.17083C13.1366 9.32577 13.0934 9.47765 13.0119 9.6094C12.9303 9.74115 12.8137 9.84755 12.675 9.91667V9.90833Z" fill="currentColor"/>
        </svg>
        Live
      </button>
      <button
        type="button"
        onClick={() => setShowFavourites(!showFavourites)}
        className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
          showFavourites
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.62295 0.889986C6.18623 -0.29666 7.81373 -0.296663 8.377 0.889983L9.3505 2.94082C9.57417 3.41203 10.0065 3.73864 10.5067 3.81421L12.6835 4.14307C13.943 4.33336 14.446 5.94266 13.5345 6.86634L11.9594 8.46269C11.5975 8.82948 11.4323 9.35795 11.5178 9.87587L11.8896 12.1299C12.1048 13.4342 10.7881 14.4288 9.66154 13.813L7.71456 12.7488C7.2672 12.5043 6.73276 12.5043 6.2854 12.7488L4.33842 13.813C3.21186 14.4288 1.89519 13.4342 2.11034 12.1299L2.48218 9.87587C2.56762 9.35795 2.40247 8.82948 2.04055 8.46269L0.465411 6.86634C-0.445992 5.94266 0.0569295 4.33336 1.31646 4.14307L3.49325 3.81421C3.99341 3.73864 4.42578 3.41203 4.64946 2.94082L5.62295 0.889986Z" fill="currentColor"/>
        </svg>
        Favourites
      </button>
    </div>
  );
}

function BackToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <button
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-6 z-30 flex items-center gap-2 h-10 px-4 rounded-full bg-bg-card/90 backdrop-blur-md border border-border-subtle shadow-[0_4px_24px_rgba(0,0,0,0.25)] text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
      style={{ animation: "back-to-top-in 0.3s ease-out" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-secondary">
        <path d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[13px] font-medium">Back to top</span>
    </button>
  );
}

function MainContent({ activeSport, activeLeague }: { activeSport: string | null; activeLeague: string | null }) {
  const mainRef = useRef<HTMLElement>(null);
  return (
    <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto">
      {!activeSport && (
        <LiveTopEvents />
      )}

      <div className="relative">
        <EventFilter />

        <div className="px-2">
          <LiveGameSections sportSlug={activeSport} leagueSlug={activeLeague} />
        </div>

      {/* Breadcrumb */}
      <div className="mt-8 flex items-center gap-1 text-sm text-text-secondary px-2">
        <span>Sports</span>
        <span>/</span>
        <span className="text-text-primary">Top events</span>
      </div>

      {/* SEO Content */}
      <div className="mt-4 mb-8 px-2">
        <h2 className="text-lg font-semibold mb-3">Crypto Sports Betting at PredictOff</h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Online sports betting is one of the world&apos;s giant economies at the moment — and it&apos;s growing rapidly. Millions of bettors are looking for the next great platform to place their wagers, and PredictOff brings a fresh approach to the table.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          PredictOff is the first online sports betting site to run on the Azuro protocol — a decentralized, trustless system built on blockchain technology. This means your bets are transparent, your funds are always in your control, and there&apos;s no middleman taking a bigger cut than necessary.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-bg-card py-[60px] px-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/images/predictoff-logo.png" alt="PredictOff" className="w-6 h-6 rounded opacity-50" />
            <span className="text-[15px] font-semibold text-text-muted">PredictOff</span>
          </div>
          <div className="text-text-secondary text-sm">Powered by Azuro</div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-20 mb-4">
          <div className="w-full lg:w-[320px]">
            <p className="text-sm text-text-muted leading-5">
              PredictOff is the first decentralized bookmaker built on Web3. No KYC, no central company — your funds stay under your control. With crypto, every bet is transparent and verifiable on-chain. Our simple interface makes betting easy for everyone, even without crypto knowledge. We are powered by Azuro, the leading decentralized betting protocol, ensuring trust and reliability at the core
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <a href="#" className="text-sm text-text-muted hover:text-text-secondary">Terms & Agreements</a>
            <a href="#" className="text-sm text-text-muted hover:text-text-secondary">Betting rules</a>
            <a href="#" className="text-sm text-text-muted hover:text-text-secondary">Privacy Policy</a>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-text-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-black">18</span>
            <span className="text-[11px] font-medium text-black">+</span>
          </div>
          <span className="text-[15px] font-medium text-text-muted">Fair play</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-20 pt-1">
          <span className="text-[15px] font-medium text-text-muted">&copy;2026 PredictOff</span>
          <a href="mailto:help@predictoff.com" className="text-[15px] font-medium text-text-muted hover:text-text-secondary">help@predictoff.com</a>
        </div>
      </footer>
      </div>

      <BackToTop scrollRef={mainRef} />
    </main>
  );
}

// ─── Mobile Bottom Nav (visible only on small screens) ──────────

/* ── Mobile Betslip Drawer ── */

function MobileBetslipDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [startY, setStartY] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > 120) onClose();
    setDragY(0);
    setStartY(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ transform: open ? `translateY(${dragY}px)` : undefined, maxHeight: "85vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-bg-page rounded-t-2xl border-t border-border-primary flex flex-col" style={{ maxHeight: "85vh" }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab">
            <div className="w-10 h-1 rounded-full bg-border-subtle" />
          </div>
          {/* Betslip content */}
          <div className="flex-1 overflow-y-auto">
            <PlayBetslip isMobileDrawer />
          </div>
        </div>
      </div>
    </>
  );
}


/* ── Mobile Sports Drawer ── */

type SportIconMap = Record<string, ({ className }: { className?: string }) => React.JSX.Element>;

function MobileSportsDrawer({
  open,
  onClose,
  activeSport,
  activeLeague,
  onSportClick,
  onLeagueClick,
  sportIcons,
}: {
  open: boolean;
  onClose: () => void;
  activeSport: string | null;
  activeLeague: string | null;
  onSportClick: (slug: string | null) => void;
  onLeagueClick: (sportSlug: string, leagueSlug: string) => void;
  sportIcons: SportIconMap;
}) {
  const { isLive } = useLive();
  const { data: sports, isFetching } = useSportsNavigation({ isLive });

  const sportsOnly = sports?.filter((s: any) => s.sporthub?.slug === "sports") ?? [];
  const totalGames = sportsOnly.reduce(
    (sum: number, s: any) => sum + (isLive ? s.activeLiveGamesCount : s.activePrematchGamesCount),
    0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer — slides in from left */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full bg-sidebar-bg border-r border-sidebar-border">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
            <span className="text-[15px] font-semibold text-text-primary">Sports</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Scrollable sports list */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {isFetching ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse mb-1" style={{ background: "var(--sidebar-hover)" }} />
              ))
            ) : (
              <>
                {/* All Events */}
                <button
                  onClick={() => onSportClick(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${
                    activeSport === null ? "bg-accent/10 text-accent" : "text-sidebar-text hover:bg-sidebar-hover"
                  }`}
                >
                  {sportIcons["top"] && (() => { const Icon = sportIcons["top"]; return <Icon className="size-5" />; })()}
                  <span className="flex-1 text-[13px] font-medium text-left">All Events</span>
                  <span className={`font-inter text-[12px] ${activeSport === null ? "text-accent font-semibold" : "text-sidebar-text-muted"}`}>
                    {totalGames}
                  </span>
                </button>

                {/* Sport items */}
                {sportsOnly.map((sport: any) => {
                  const Icon = sportIcons[sport.slug] ?? sportIcons["top"];
                  const gameCount = isLive ? sport.activeLiveGamesCount : sport.activePrematchGamesCount;
                  const isActive = activeSport === sport.slug;
                  return (
                    <div key={sport.slug}>
                      <button
                        onClick={() => onSportClick(sport.slug)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${
                          isActive && !activeLeague ? "bg-accent/10 text-accent" : "text-sidebar-text hover:bg-sidebar-hover"
                        }`}
                      >
                        {Icon && <Icon className="size-5" />}
                        <span className="flex-1 text-[13px] font-medium text-left">{sport.name}</span>
                        <span className="flex items-center gap-1.5">
                          <span className={`font-inter text-[12px] ${isActive && !activeLeague ? "text-accent font-semibold" : "text-sidebar-text-muted"}`}>
                            {gameCount}
                          </span>
                          <svg
                            width="10" height="10" viewBox="0 0 10 10" fill="none"
                            className={`text-sidebar-text-muted transition-transform duration-150 ${isActive ? "rotate-90" : ""}`}
                          >
                            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>

                      {/* League sub-items */}
                      {isActive && sport.countries && (
                        <div className="ml-4 pl-4 border-l border-sidebar-border">
                          {sport.countries.map((country: any) =>
                            country.leagues.map((league: any) => {
                              const leagueCount = isLive ? league.activeLiveGamesCount : league.activePrematchGamesCount;
                              if (leagueCount === 0) return null;
                              const isLeagueActive = activeLeague === league.slug;
                              return (
                                <button
                                  key={league.slug}
                                  onClick={() => onLeagueClick(sport.slug, league.slug)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-left transition-colors cursor-pointer ${
                                    isLeagueActive ? "bg-accent/10 text-accent" : "text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover"
                                  }`}
                                >
                                  <span className="flex-1 text-[12px] font-medium truncate">{league.name}</span>
                                  <span className={`font-inter text-[11px] ${isLeagueActive ? "text-accent" : "text-sidebar-text-muted"}`}>
                                    {leagueCount}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Mobile Nav ── */

function MobileNav({
  onTabChange,
  activeTab,
  onBetslipOpen,
  onSportsToggle,
  betslipCount,
}: {
  onTabChange: (tab: "sports" | "live" | "betslip" | "bets" | "social") => void;
  activeTab: string;
  onBetslipOpen: () => void;
  onSportsToggle: () => void;
  betslipCount: number;
}) {
  const { isLive, changeLive } = useLive();
  const [, startTransition] = useTransition();

  function NavBtn({ label, active, onClick, children }: {
    label: string; active: boolean; onClick: () => void; children: React.ReactNode;
  }) {
    return (
      <button onClick={onClick} className="flex-1 flex flex-col items-center py-1 cursor-pointer">
        <div className="w-5 h-5 flex items-center justify-center">{children}</div>
        <span className={`font-inter text-[11px] font-medium leading-[14px] mt-0.5 ${active ? "text-white" : "text-[#8a8a98]"}`}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-pb">
      <div className="relative flex items-end h-[44px]" style={{ background: "#040406" }}>
        {/* Live */}
        <NavBtn label="Live" active={isLive} onClick={() => startTransition(() => changeLive(!isLive))}>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <path d="M11.5094 9.80837C11.3425 9.8075 11.1795 9.75754 11.0408 9.66471C10.9021 9.57188 10.7937 9.44029 10.7292 9.28632C10.6648 9.13235 10.647 8.96281 10.6782 8.79883C10.7094 8.63484 10.7881 8.48365 10.9046 8.36409C11.5422 7.7234 11.9002 6.85627 11.9002 5.95237C11.9002 5.04846 11.5422 4.18134 10.9046 3.54064C10.7477 3.38006 10.6608 3.16391 10.6627 2.93942C10.6647 2.71493 10.7554 2.50035 10.9151 2.34255C11.0748 2.18475 11.2905 2.09656 11.515 2.09726C11.7395 2.09795 11.9546 2.18747 12.1133 2.34625C13.0654 3.3049 13.5998 4.60121 13.5998 5.95237C13.5998 7.30352 13.0654 8.59984 12.1133 9.55848C12.0341 9.63797 11.94 9.70099 11.8364 9.74388C11.7327 9.78677 11.6216 9.80869 11.5094 9.80837ZM6.08931 9.56358C6.16876 9.48507 6.23194 9.39166 6.27525 9.28871C6.31856 9.18575 6.34115 9.07527 6.34172 8.96358C6.34229 8.85188 6.32083 8.74117 6.27856 8.63778C6.2363 8.53439 6.17407 8.44035 6.09543 8.36103C5.45813 7.72038 5.10037 6.85347 5.10037 5.94982C5.10037 5.04616 5.45813 4.17926 6.09543 3.5386C6.17392 3.45924 6.23601 3.36519 6.27816 3.26184C6.3203 3.15848 6.34168 3.04783 6.34106 2.93621C6.34045 2.82459 6.31785 2.71419 6.27457 2.6113C6.23129 2.50841 6.16816 2.41506 6.0888 2.33656C6.00944 2.25807 5.91539 2.19598 5.81203 2.15384C5.70867 2.11169 5.59803 2.09031 5.48641 2.09093C5.37479 2.09154 5.26438 2.11414 5.1615 2.15742C5.05861 2.20071 4.96525 2.26383 4.88676 2.34319C3.93429 3.30188 3.39972 4.59842 3.39972 5.94982C3.39972 7.30122 3.93429 8.59775 4.88676 9.55644C4.96521 9.63595 5.05856 9.69922 5.16148 9.74262C5.2644 9.78602 5.37486 9.8087 5.48656 9.80936C5.59825 9.81002 5.70898 9.78866 5.8124 9.74648C5.91583 9.70431 6.00993 9.64216 6.08931 9.56358ZM14.8172 11.6198C16.2222 10.0655 17 8.04499 17 5.94982C17 3.85465 16.2222 1.83409 14.8172 0.27979C14.666 0.112612 14.4546 0.0123525 14.2294 0.00106689C14.0043 -0.0102187 13.7839 0.0683941 13.6167 0.219611C13.4495 0.370828 13.3493 0.582263 13.338 0.807402C13.3267 1.03254 13.4053 1.25294 13.5565 1.42012C14.6787 2.66196 15.2999 4.2761 15.2999 5.94982C15.2999 7.62354 14.6787 9.23768 13.5565 10.4795C13.4053 10.6467 13.3267 10.8671 13.338 11.0922C13.3493 11.3174 13.4495 11.5288 13.6167 11.68C13.7839 11.8312 14.0043 11.9099 14.2294 11.8986C14.4546 11.8873 14.666 11.787 14.8172 11.6198ZM3.38332 11.68C3.46621 11.6052 3.53354 11.5149 3.58148 11.414C3.62942 11.3132 3.65702 11.2039 3.6627 11.0925C3.66838 10.981 3.65204 10.8694 3.6146 10.7643C3.57717 10.6591 3.51937 10.5623 3.44452 10.4795C2.32239 9.23768 1.70115 7.62354 1.70115 5.94982C1.70115 4.2761 2.32239 2.66196 3.44452 1.42012C3.58846 1.25172 3.66102 1.03381 3.64678 0.812737C3.63254 0.591664 3.53262 0.384867 3.36827 0.236325C3.20391 0.087784 2.9881 0.00921726 2.76671 0.0173342C2.54533 0.0254511 2.33585 0.119611 2.18281 0.27979C0.777862 1.83409 0 3.85465 0 5.94982C0 8.04499 0.777862 10.0655 2.18281 11.6198C2.25767 11.7027 2.3481 11.7699 2.44896 11.8178C2.54981 11.8656 2.65911 11.8931 2.7706 11.8987C2.88209 11.9043 2.99359 11.8879 3.09872 11.8503C3.20385 11.8128 3.30056 11.7549 3.38332 11.68ZM8.50053 4.67485C8.16238 4.67485 7.83809 4.80918 7.59899 5.04828C7.35989 5.28738 7.22556 5.61168 7.22556 5.94982C7.22556 6.28796 7.35989 6.61225 7.59899 6.85135C7.83809 7.09046 8.16238 7.22478 8.50053 7.22478C8.83867 7.22478 9.16296 7.09046 9.40206 6.85135C9.64116 6.61225 9.77549 6.28796 9.77549 5.94982C9.77549 5.61168 9.64116 5.28738 9.40206 5.04828C9.16296 4.80918 8.83867 4.67485 8.50053 4.67485Z" fill={isLive ? "#ffffff" : "#8a8a98"} />
          </svg>
        </NavBtn>

        {/* Sports */}
        <NavBtn label="Sports" active={activeTab === "sports" && !isLive} onClick={onSportsToggle}>
          <svg width="17" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke={activeTab === "sports" && !isLive ? "#ffffff" : "#8a8a98"} strokeWidth="1.5"/>
            <path d="M10 2.5C10 2.5 12.5 6 12.5 10C12.5 14 10 17.5 10 17.5M10 2.5C10 2.5 7.5 6 7.5 10C7.5 14 10 17.5 10 17.5M3 7.5H17M3 12.5H17" stroke={activeTab === "sports" && !isLive ? "#ffffff" : "#8a8a98"} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </NavBtn>

        {/* Betslip — center notch button */}
        <div className="relative flex flex-col items-center" style={{ width: 64 }}>
          {/* Notch cutout shape */}
          <svg className="absolute bottom-0" width="64" height="61" viewBox="0 0 64 61" fill="none" style={{ pointerEvents: "none" }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M60.006 17C56.45 17 53.436 14.57 51.64 11.503C47.6 4.604 40.315 0 32 0C23.685 0 16.4 4.604 12.36 11.503C10.564 14.57 7.55 17 3.994 17H0V61H64V17H60.006Z" fill="#040406"/>
          </svg>
          {/* Circle button */}
          <button
            onClick={onBetslipOpen}
            className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center bg-accent active:scale-95 transition-transform cursor-pointer"
            style={{ marginBottom: 6 }}
          >
            <svg width="18" height="21" viewBox="0 0 18 21" fill="none">
              <path d="M10.8907 3.24082C10.5722 3.15425 10.283 2.98295 10.0541 2.74513C9.82511 2.50732 9.6649 2.21189 9.59048 1.89027C9.4411 1.28359 8.92283 0.823248 8.31463 0.66167L6.07693 0.0610881C5.60943 -0.0628555 5.11187 0.00339649 4.69309 0.245352C4.27431 0.487307 3.9684 0.885269 3.84227 1.35219L0.0619642 15.4506C0.000199407 15.6808 -0.0155919 15.9209 0.015493 16.1572C0.0465778 16.3936 0.123929 16.6214 0.243126 16.8278C0.362323 17.0342 0.521028 17.2151 0.71017 17.3601C0.899311 17.5052 1.11518 17.6115 1.34544 17.6731L3.59381 18.2767C4.20049 18.4383 4.87881 18.3072 5.3041 17.8468C5.76139 17.3743 6.44276 17.1609 7.11194 17.3392C7.78264 17.5191 8.27042 18.0557 8.41218 18.6883C8.56157 19.2949 9.07983 19.7553 9.68804 19.9184L11.9273 20.519C12.3948 20.6429 12.8923 20.5767 13.3111 20.3347C13.7299 20.0928 14.0358 19.6948 14.1619 19.2279L17.9392 5.12792C18.0627 4.66084 17.9964 4.16386 17.7548 3.74546C17.5132 3.32707 17.1159 3.02126 16.6496 2.8948L14.4104 2.29422C13.8022 2.13264 13.1239 2.27135 12.6909 2.72102C12.4655 2.9622 12.1789 3.13776 11.8617 3.22902C11.5444 3.32029 11.2083 3.32383 10.8892 3.23929L10.8907 3.24082ZM13.2046 9.05457L11.2047 10.8807L12.034 13.4629C12.1559 13.8546 11.7306 14.2037 11.3724 13.9949L9.01124 12.6535L6.81165 14.2357C6.73684 14.2902 6.64726 14.3207 6.55476 14.3232C6.46226 14.3256 6.37118 14.3 6.29356 14.2496C6.21593 14.1993 6.15542 14.1265 6.12 14.041C6.08459 13.9555 6.07595 13.8613 6.09522 13.7708L6.64397 11.1215L4.47639 9.52101C4.14714 9.27255 4.2889 8.74361 4.69589 8.70093L7.38327 8.40216L8.23231 5.83368C8.36493 5.44346 8.91216 5.41145 9.08593 5.78795L10.1987 8.25735L12.8967 8.26345C13.3235 8.26345 13.5156 8.77867 13.2062 9.05609L13.2046 9.05457Z" fill="#040406"/>
            </svg>
            {betslipCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-white text-accent text-[9px] font-bold px-0.5">
                {betslipCount}
              </span>
            )}
          </button>
          <span className="relative z-10 font-inter text-[11px] font-medium leading-[14px] text-[#8a8a98]" style={{ marginBottom: 4 }}>Betslip</span>
        </div>

        {/* Esports */}
        <NavBtn label="Esports" active={activeTab === "social"} onClick={() => onTabChange("social")}>
          <svg width="19" height="14" viewBox="0 0 19 14" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.5126 0.171322C16.3875 0.724656 17.6502 2.75152 18.4903 6.54682C18.916 8.46627 19.0721 9.94689 18.9697 11.0748C18.8359 12.5443 18.2502 13.4665 17.2286 13.8152C16.58 14.0381 15.9112 13.952 15.2423 13.5638C14.7396 13.2709 14.236 12.8058 13.7019 12.142C12.8546 11.085 11.8716 10.7637 9.49917 10.7637C6.84195 10.7637 5.98256 11.2279 5.24985 12.142C4.60125 12.9497 3.65065 13.9368 2.46494 13.9368C2.21359 13.9359 1.96418 13.8927 1.72716 13.8091C-0.00175646 13.2112 -0.45172 10.631 0.463409 6.5448C1.31469 2.74747 2.57743 0.722629 4.44214 0.170308C4.85157 0.0557903 5.27316 -0.00197532 5.6988 5.15453e-05C6.23997 5.15453e-05 6.71223 0.131798 7.21186 0.273678C7.81586 0.441908 8.50094 0.633447 9.49917 0.633447C10.4964 0.633447 11.1815 0.440895 11.7834 0.272665C12.2841 0.132811 12.7563 5.15453e-05 13.2995 5.15453e-05C13.71 -0.00197532 14.1184 0.0557904 14.5126 0.172335V0.171322ZM6.33118 6.334H7.59797C7.76596 6.334 7.92707 6.26727 8.04585 6.14849C8.16463 6.0297 8.23137 5.8686 8.23137 5.70061C8.23137 5.53262 8.16463 5.37151 8.04585 5.25273C7.92707 5.13395 7.76596 5.06721 7.59797 5.06721H6.33118V3.80042C6.33118 3.63244 6.26445 3.47133 6.14567 3.35254C6.02688 3.23376 5.86577 3.16703 5.69779 3.16703C5.5298 3.16703 5.36869 3.23376 5.24991 3.35254C5.13112 3.47133 5.06439 3.63244 5.06439 3.80042V5.06721H3.7976C3.62961 5.06721 3.46851 5.13395 3.34972 5.25273C3.23094 5.37151 3.16421 5.53262 3.16421 5.70061C3.16421 5.8686 3.23094 6.0297 3.34972 6.14849C3.46851 6.26727 3.62961 6.334 3.7976 6.334H5.06439V7.60079C5.06439 7.76878 5.13112 7.92989 5.24991 8.04867C5.36869 8.16746 5.5298 8.23419 5.69779 8.23419C5.86577 8.23419 6.02688 8.16746 6.14567 8.04867C6.26445 7.92989 6.33118 7.76878 6.33118 7.60079V6.334ZM10.4832 6.35934C10.6578 6.47599 10.8715 6.51851 11.0775 6.47756C11.2834 6.4366 11.4646 6.31552 11.5813 6.14094C11.6979 5.96637 11.7404 5.75261 11.6995 5.54669C11.6585 5.34076 11.5374 5.15954 11.3629 5.04289C11.2764 4.98513 11.1795 4.94496 11.0775 4.92468C10.9755 4.9044 10.8706 4.90439 10.7686 4.92467C10.5627 4.96563 10.3815 5.08671 10.2648 5.26129C10.1482 5.43586 10.1056 5.64962 10.1466 5.85554C10.1876 6.06147 10.3086 6.24269 10.4832 6.35934ZM12.2253 8.10042C12.3116 8.15818 12.4084 8.19837 12.5103 8.2187C12.6121 8.23904 12.717 8.23912 12.8188 8.21893C12.9207 8.19874 13.0176 8.15869 13.104 8.10106C13.1904 8.04343 13.2646 7.96934 13.3223 7.88303C13.3801 7.79673 13.4203 7.69989 13.4406 7.59805C13.461 7.49621 13.461 7.39136 13.4409 7.28949C13.4207 7.18762 13.3806 7.09073 13.323 7.00434C13.2654 6.91795 13.1913 6.84375 13.105 6.78599C12.9307 6.66934 12.7172 6.62671 12.5114 6.66748C12.3057 6.70825 12.1246 6.82907 12.0079 7.00338C11.8913 7.17768 11.8486 7.39118 11.8894 7.59692C11.9302 7.80265 12.051 7.98377 12.2253 8.10042ZM12.2253 4.61725C12.3118 4.67501 12.4088 4.71516 12.5109 4.73542C12.6129 4.75568 12.7179 4.75565 12.8199 4.73532C12.9219 4.71499 13.0189 4.67477 13.1054 4.61695C13.1919 4.55914 13.2661 4.48485 13.3239 4.39835C13.3816 4.31184 13.4218 4.21481 13.442 4.11278C13.4623 4.01076 13.4623 3.90574 13.4419 3.80373C13.4216 3.70172 13.3814 3.60471 13.3236 3.51825C13.2658 3.43178 13.1915 3.35755 13.105 3.29979C12.9303 3.18314 12.7164 3.14067 12.5103 3.18172C12.3043 3.22277 12.1231 3.34398 12.0064 3.51869C11.8898 3.69339 11.8473 3.90728 11.8883 4.1133C11.9294 4.31932 12.0506 4.5006 12.2253 4.61725ZM13.9674 6.35934C14.0538 6.4171 14.1508 6.45727 14.2528 6.47755C14.3547 6.49783 14.4597 6.49784 14.5617 6.47756C14.6636 6.45728 14.7606 6.41711 14.847 6.35936C14.9335 6.3016 15.0077 6.22738 15.0654 6.14094C15.1232 6.05451 15.1634 5.95754 15.1837 5.85557C15.2039 5.75361 15.2039 5.64865 15.1837 5.54669C15.1634 5.44472 15.1232 5.34775 15.0655 5.26131C15.0077 5.17487 14.9335 5.10065 14.8471 5.04289C14.6725 4.92624 14.4587 4.88372 14.2528 4.92467C14.0469 4.96563 13.8656 5.08671 13.749 5.26129C13.6323 5.43586 13.5898 5.64962 13.6308 5.85554C13.6717 6.06147 13.7928 6.24269 13.9674 6.35934Z" fill={activeTab === "social" ? "#ffffff" : "#8a8a98"} />
          </svg>
        </NavBtn>

        {/* My Bets */}
        <NavBtn label="My Bets" active={activeTab === "bets"} onClick={() => onTabChange("bets")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M1.27169 0C0.934416 0 0.610957 0.133981 0.372469 0.372469C0.133981 0.610957 0 0.934416 0 1.27169V12.7283C0 13.0656 0.133981 13.3891 0.372469 13.6276C0.610957 13.866 0.934416 14 1.27169 14H1.48788C1.74083 14 1.98342 13.8995 2.16229 13.7207C2.34116 13.5418 2.44164 13.2992 2.44164 13.0463C2.44164 12.6247 2.60912 12.2203 2.90723 11.9222C3.20534 11.6241 3.60966 11.4566 4.03125 11.4566C4.45284 11.4566 4.85717 11.6241 5.15528 11.9222C5.45339 12.2203 5.62086 12.6247 5.62086 13.0463C5.62086 13.5727 6.04815 14 6.57463 14H7.21047C7.46343 14 7.70602 13.8995 7.88489 13.7207C8.06375 13.5418 8.16424 13.2992 8.16424 13.0463C8.16424 12.6247 8.33172 12.2203 8.62983 11.9222C8.92794 11.6241 9.33226 11.4566 9.75385 11.4566C10.1754 11.4566 10.5798 11.6241 10.8779 11.9222C11.176 12.2203 11.3435 12.6247 11.3435 13.0463C11.3435 13.5727 11.7707 14 12.2972 14H12.6152C12.9524 14 13.2759 13.866 13.5144 13.6276C13.7529 13.3891 13.8868 13.0656 13.8868 12.7283V1.27169C13.8868 0.934416 13.7529 0.610957 13.5144 0.372469C13.2759 0.133981 12.9524 0 12.6152 0H1.27169ZM2.75956 1.91898C2.63431 1.91898 2.51029 1.94365 2.39457 1.99158C2.27886 2.03951 2.17371 2.10976 2.08515 2.19833C1.99658 2.2869 1.92633 2.39204 1.8784 2.50775C1.83047 2.62347 1.8058 2.74749 1.8058 2.87274C1.8058 2.998 1.83047 3.12202 1.8784 3.23774C1.92633 3.35345 1.99658 3.45859 2.08515 3.54716C2.17371 3.63573 2.27886 3.70598 2.39457 3.75391C2.51029 3.80184 2.63431 3.82651 2.75956 3.82651H11.0255C11.2785 3.82651 11.5211 3.72603 11.7 3.54716C11.8788 3.36829 11.9793 3.1257 11.9793 2.87274C11.9793 2.61979 11.8788 2.3772 11.7 2.19833C11.5211 2.01946 11.2785 1.91898 11.0255 1.91898H2.75956ZM8.80008 6.81498H11.3435C11.5627 6.81498 11.7729 6.90207 11.928 7.05708C12.083 7.2121 12.1701 7.42235 12.1701 7.64158C12.1701 7.8608 12.083 8.07105 11.928 8.22607C11.7729 8.38109 11.5627 8.46817 11.3435 8.46817H8.80008C8.58086 8.46817 8.37061 8.38109 8.21559 8.22607C8.06058 8.07105 7.97349 7.8608 7.97349 7.64158C7.97349 7.42235 8.06058 7.2121 8.21559 7.05708C8.37061 6.90207 8.58086 6.81498 8.80008 6.81498ZM3.20593 9.35073C3.28264 9.42797 3.37387 9.48928 3.47438 9.53111C3.57489 9.57295 3.68267 9.59448 3.79154 9.59448C3.9004 9.59448 4.00819 9.57295 4.1087 9.53111C4.2092 9.48928 4.30044 9.42797 4.37715 9.35073L6.6255 7.10111C6.70232 7.02429 6.76325 6.93309 6.80483 6.83272C6.8464 6.73235 6.8678 6.62477 6.8678 6.51613C6.8678 6.40749 6.8464 6.29992 6.80483 6.19955C6.76325 6.09917 6.70232 6.00798 6.6255 5.93116C6.54868 5.85433 6.45748 5.7934 6.35711 5.75182C6.25674 5.71025 6.14916 5.68885 6.04052 5.68885C5.93188 5.68885 5.8243 5.71025 5.72393 5.75182C5.62356 5.7934 5.53236 5.85433 5.45554 5.93116L3.79218 7.59707L3.02662 6.83151C2.94988 6.75469 2.85877 6.69374 2.75847 6.65213C2.65818 6.61052 2.55067 6.58908 2.44209 6.58902C2.33351 6.58896 2.22598 6.61029 2.12564 6.65179C2.0253 6.69328 1.93412 6.75414 1.8573 6.83088C1.78048 6.90761 1.71953 6.99873 1.67792 7.09902C1.63631 7.19932 1.61487 7.30682 1.61481 7.4154C1.61475 7.52398 1.63608 7.63151 1.67758 7.73185C1.71907 7.83219 1.77993 7.92337 1.85667 8.00019L3.20593 9.34818V9.35073Z" fill={activeTab === "bets" ? "#ffffff" : "#8a8a98"} />
          </svg>
        </NavBtn>
      </div>
    </nav>
  );
}

function MobileNavWithCount({ activeTab, onTabChange, onBetslipOpen, onSportsToggle }: {
  activeTab: string;
  onTabChange: (tab: "sports" | "live" | "betslip" | "bets" | "social") => void;
  onBetslipOpen: () => void;
  onSportsToggle: () => void;
}) {
  const { items } = useBaseBetslip();
  return <MobileNav activeTab={activeTab} onTabChange={onTabChange} onBetslipOpen={onBetslipOpen} onSportsToggle={onSportsToggle} betslipCount={items.length} />;
}

// ─── Page ────────────────────────────────────────────────────────

export default function Home() {
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"sports" | "live" | "betslip" | "bets" | "social">("sports");
  const [activePage, setActivePage] = useState<"sports" | "social" | "leaderboard">("sports");
  const [betslipDrawerOpen, setBetslipDrawerOpen] = useState(false);
  const [mobileSportsOpen, setMobileSportsOpen] = useState(false);
  const gameModal = useGameModal();

  return (
    <GameModalProvider openGame={gameModal.open}>
      <SidebarProvider>
      <div className="min-h-screen bg-bg-page flex flex-col">
        <HeaderClient activePage={activePage} onPageChange={(p) => { setActivePage(p as "sports" | "social" | "leaderboard"); if (p === "social") setMobileTab("social"); }} />
        <div className="flex flex-1">
          <div className="w-full flex h-[calc(100vh-56px)]">
            {/* Desktop: always show all three columns */}
            <div className="hidden lg:contents">
              <AppSidebar
                activeSport={activeSport}
                activeLeague={activeLeague}
                onSportClick={(slug) => { setActiveSport(slug); setActiveLeague(null); setActivePage("sports"); }}
                onLeagueClick={(sportSlug, leagueSlug) => { setActiveSport(sportSlug); setActiveLeague(leagueSlug); setActivePage("sports"); }}
                sportIcons={sportIcons}
              />
            </div>

            {/* Mobile: show based on active tab */}
            <div className="contents lg:hidden">
              {(mobileTab === "sports" || mobileTab === "live") && (
                <MainContent activeSport={activeSport} activeLeague={activeLeague} />
              )}
              {mobileTab === "social" && <SocialFeed />}
              {mobileTab === "bets" && (
                <PlayBetslip />
              )}
            </div>

            {/* Desktop: always show center + right */}
            <div className="hidden lg:contents">
              {activePage === "leaderboard" ? <WaveLeaderboard /> : activePage === "social" ? <SocialFeed /> : <MainContent activeSport={activeSport} activeLeague={activeLeague} />}
              <PlayBetslip />
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNavWithCount
          activeTab={mobileTab}
          onTabChange={(tab) => { setMobileTab(tab); setMobileSportsOpen(false); }}
          onBetslipOpen={() => setBetslipDrawerOpen(true)}
          onSportsToggle={() => { setMobileTab("sports"); setMobileSportsOpen((v) => !v); }}
        />

        {/* Mobile sports sidebar drawer */}
        <MobileSportsDrawer
          open={mobileSportsOpen}
          onClose={() => setMobileSportsOpen(false)}
          activeSport={activeSport}
          activeLeague={activeLeague}
          onSportClick={(slug) => { setActiveSport(slug); setActiveLeague(null); setActivePage("sports"); setMobileSportsOpen(false); }}
          onLeagueClick={(sportSlug, leagueSlug) => { setActiveSport(sportSlug); setActiveLeague(leagueSlug); setActivePage("sports"); setMobileSportsOpen(false); }}
          sportIcons={sportIcons}
        />

        {/* Mobile betslip drawer */}
        <MobileBetslipDrawer open={betslipDrawerOpen} onClose={() => setBetslipDrawerOpen(false)} />

        {/* Bottom padding for mobile nav */}
        <div className="h-[60px] lg:hidden" />
      </div>

      {/* Interceptive game modal */}
      {gameModal.isOpen && gameModal.gameId && (
        <GameModal gameId={gameModal.gameId} onClose={gameModal.close} />
      )}
      </SidebarProvider>
    </GameModalProvider>
  );
}
