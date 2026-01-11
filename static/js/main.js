/**
 * MAIN SITE JAVASCRIPT - DYNAMIC THEME STABLE
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const cyclingElement = document.getElementById('typing-skill');
        const typewriter = document.querySelector('.typewriter-target');
        const hiddenContent = document.querySelector('.content-hidden');

        // --- 1. HOME PAGE SKILLS CYCLING ---
        if (cyclingElement) {
            const skills = ["Application Security", "Penetration Testing", "Security Architecture", "Vulnerability Management", "Cloud Security", "Incident Response"];
            let skillIndex = 0, charIndex = 0, isDeleting = false;

            function typeCycling() {
                const currentSkill = skills[skillIndex];
                cyclingElement.textContent = isDeleting 
                    ? currentSkill.substring(0, charIndex - 1) 
                    : currentSkill.substring(0, charIndex + 1);
                
                charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
                let typeSpeed = isDeleting ? 75 : 150;

                if (!isDeleting && charIndex === currentSkill.length) {
                    isDeleting = true;
                    typeSpeed = 2000; 
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    skillIndex = (skillIndex + 1) % skills.length;
                    typeSpeed = 500;
                }
                setTimeout(typeCycling, typeSpeed);
            }
            typeCycling();
        }

        // --- 2. SUB-PAGE SEQUENTIAL REVEAL ---
        if (typewriter && hiddenContent) {
            hiddenContent.style.display = 'none';

            const targets = hiddenContent.querySelectorAll(
                '.profile-section, .exp-item, .edu-item, .cve-entry, .skill-category, .pub-item, .ach-item'
            );

            targets.forEach(el => {
                el.style.opacity = "0";
                el.style.transform = "translateY(10px)";
                el.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
            });

            const textToType = typewriter.getAttribute('data-text') || "";
            typewriter.textContent = ""; 
            let i = 0;

            function typeHeader() {
                if (i < textToType.length) {
                    typewriter.textContent += textToType.charAt(i);
                    i++;
                    setTimeout(typeHeader, 45);
                } else {
                    setTimeout(startReveal, 300);
                }
            }

            async function startReveal() {
                hiddenContent.style.display = 'block';
                const sections = Array.from(hiddenContent.children);

                for (const section of sections) {
                    section.style.opacity = "1";
                    section.style.transform = "translateY(0)";
                    await new Promise(r => setTimeout(r, 150));

                    const items = section.querySelectorAll(
                        '.exp-item, .edu-item, .cve-entry, .skill-category, .pub-item, .ach-item'
                    );
                    
                    for (const item of items) {
                        item.style.opacity = "1";
                        item.style.transform = "translateY(0)";
                        await new Promise(r => setTimeout(r, 60)); 
                    }
                    await new Promise(r => setTimeout(r, 150));
                }
            }
            setTimeout(typeHeader, 400);

        } else if (hiddenContent) {
            hiddenContent.style.display = 'block';
        }

    } catch (err) {
        console.error("Terminal Script Error:", err);
    }
});
