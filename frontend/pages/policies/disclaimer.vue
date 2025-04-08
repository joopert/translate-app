<template>
  <main class="pt-8 pb-16 lg:pt-16 lg:pb-24 bg-white dark:bg-gray-900 antialiased">
    <div class="flex justify-between px-4 mx-auto max-w-screen-xl">
      <article
        class="mx-auto w-full max-w-2xl format format-sm sm:format-base lg:format-lg format-primary dark:format-invert"
      >
        <header class="mb-4 lg:mb-6 not-format">
          <TypographyHeader tag="h1">Disclaimer</TypographyHeader>
        </header>
        <TypographyHeader tag="h2">Third-Party Referrals and Information Accuracy</TypographyHeader>
        <TypographyP class="mb-3">
          {{ $config.public.company.officialName }} is a referral service that provides links to
          third-party travel deals and offers. We do not sell or book flights, hotels, or other
          travel services directly.
        </TypographyP>
        <TypographyP class="mb-3">
          While we strive to present accurate and up-to-date information, the prices, availability,
          and details of travel services displayed on our website are subject to change without
          notice. We cannot guarantee the accuracy of information provided by third-party websites
          or service providers.
        </TypographyP>
        <TypographyP class="mb-3">
          All bookings and transactions occur directly between users and the third-party service
          providers.
          {{ $config.public.company.officialName }} is not responsible for any aspect of the booking
          process, including but not limited to pricing, availability, quality of service, or any
          issues that may arise from these transactions.
        </TypographyP>
        <TypographyP class="mb-3">
          We recommend that users carefully review all terms, conditions, and policies on the
          third-party websites before making any reservations or financial commitments.
        </TypographyP>
        <TypographyP class="mb-3">
          By using {{ $config.public.company.officialName }}, you acknowledge that we are not liable
          for any losses, damages, or inconveniences resulting from the use of information found on
          our website or the services provided by third-party travel providers.
        </TypographyP>
      </article>
    </div>
  </main>
</template>
